// =====================================================================
// DONATION CONTEXT — donations and campaigns are backed by Supabase
// (donations / donation_campaigns / campaign_expenses tables). Proof-
// of-payment files (from donors) and expense receipts (from admins
// logging where funds went) both go to the same private
// `donation-proofs` Storage bucket, not inline base64.
// Every screen that already uses useDonations() keeps working
// unchanged — only what's inside this file changed.
// =====================================================================
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../AuthContext';

export interface DonationRecord {
  id: string;
  donorId: string;
  alumniName: string;
  alumniEmail: string;
  department: string;
  campaign: string;
  amount: number;
  type: 'Cash' | 'In-Kind';
  description: string;
  proofUrl: string | null; // storage PATH, not a browsable URL — resolve with getProofUrl()
  status: 'Pending' | 'Verified' | 'Rejected';
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  target: number;
  current: number;
  department: string;
  active: boolean;
  deadline?: string;
}

export interface CampaignExpense {
  id: string;
  campaignId: string;
  description: string;
  amount: number;
  spentAt: string;
  loggedBy?: string;
  createdAt: string;
  receiptUrl: string | null; // storage PATH, not a browsable URL — resolve with getProofUrl()
}

export interface PaymentDestination {
  id: string;
  type: 'Bank' | 'E-Wallet' | 'Other';
  providerName: string;
  accountName: string;
  accountNumber: string;
  qrCodeUrl: string | null; // public URL (public-assets bucket) — browsable as-is
  isActive: boolean;
  sortOrder: number;
}

interface DonationCtx {
  donations: DonationRecord[];
  campaigns: Campaign[];
  expenses: CampaignExpense[];
  paymentDestinations: PaymentDestination[];
  submitDonation: (
    d: Omit<DonationRecord, 'id' | 'status' | 'submittedAt' | 'proofUrl' | 'donorId'>,
    proofFile?: File | null
  ) => Promise<void>;
  verifyDonation: (id: string, verifiedBy: string) => Promise<void>;
  rejectDonation: (id: string, reason: string, verifiedBy: string) => Promise<void>;
  addCampaign: (c: Omit<Campaign, 'id' | 'current'>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  deleteDonation: (id: string) => Promise<void>;
  addExpense: (campaignId: string, description: string, amount: number, loggedBy: string, receiptFile?: File | null) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getProofUrl: (path: string) => Promise<string | null>;
  addPaymentDestination: (d: Omit<PaymentDestination, 'id' | 'sortOrder' | 'qrCodeUrl'>, qrFile?: File | null) => Promise<void>;
  updatePaymentDestination: (id: string, d: Omit<PaymentDestination, 'id' | 'sortOrder' | 'qrCodeUrl'>, qrFile?: File | null) => Promise<void>;
  deletePaymentDestination: (id: string) => Promise<void>;
  movePaymentDestination: (id: string, direction: 'up' | 'down') => Promise<void>;
}

const Ctx = createContext<DonationCtx>({
  donations: [], campaigns: [], expenses: [], paymentDestinations: [],
  submitDonation: async () => {}, verifyDonation: async () => {},
  rejectDonation: async () => {}, addCampaign: async () => {},
  deleteCampaign: async () => {}, deleteDonation: async () => {},
  addExpense: async () => {}, deleteExpense: async () => {},
  getProofUrl: async () => null,
  addPaymentDestination: async () => {}, updatePaymentDestination: async () => {},
  deletePaymentDestination: async () => {}, movePaymentDestination: async () => {},
});

const statusMap: Record<string, DonationRecord['status']> = {
  pending: 'Pending', verified: 'Verified', rejected: 'Rejected',
};

const PROOFS_BUCKET = 'donation-proofs';
const PUBLIC_BUCKET = 'public-assets';

export function DonationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [expenses, setExpenses] = useState<CampaignExpense[]>([]);
  const [paymentDestinations, setPaymentDestinations] = useState<PaymentDestination[]>([]);

  const loadExpenses = async () => {
    const { data } = await supabase.from('campaign_expenses').select('*').order('spent_at', { ascending: false });
    if (!data) return;
    setExpenses(data.map((e: any) => ({
      id: e.id, campaignId: e.campaign_id, description: e.description,
      amount: Number(e.amount), spentAt: e.spent_at, loggedBy: e.logged_by || undefined,
      createdAt: e.created_at, receiptUrl: e.receipt_url || null,
    })));
  };

  const loadCampaigns = async () => {
    const { data } = await supabase.from('donation_campaigns').select('*').order('created_at', { ascending: false });
    if (!data) return;
    // "current" = sum of verified donations for this campaign
    const { data: totals } = await supabase.from('donations').select('campaign_id, amount').eq('status', 'verified');
    const sums: Record<string, number> = {};
    (totals || []).forEach(t => { if (t.campaign_id) sums[t.campaign_id] = (sums[t.campaign_id] || 0) + Number(t.amount); });
    setCampaigns(data.map((c: any) => ({
      id: c.id, name: c.name, description: c.description || '',
      target: Number(c.goal_amount) || 0, current: sums[c.id] || 0,
      department: c.department || 'All', active: c.active,
      deadline: c.deadline || undefined,
    })));
  };

  const loadDonations = async () => {
    const { data } = await supabase
      .from('donations')
      .select('*, donor:profiles!donations_donor_id_fkey(name, email, department), campaign:donation_campaigns(name)')
      .order('created_at', { ascending: false });
    if (!data) return;
    setDonations(data.map((d: any) => ({
      id: d.id,
      donorId: d.donor_id,
      alumniName: d.donor?.name || 'Unknown',
      alumniEmail: d.donor?.email || '',
      department: d.donor?.department || '',
      campaign: d.campaign?.name || '',
      amount: Number(d.amount),
      type: d.type === 'In-Kind' ? 'In-Kind' : 'Cash',
      description: d.description || '',
      proofUrl: d.proof_url || null,
      status: statusMap[d.status] || 'Pending',
      submittedAt: d.created_at,
      verifiedAt: d.verified_at || undefined,
      verifiedBy: d.verified_by || undefined,
      rejectionReason: d.rejection_reason || undefined,
    })));
  };

  const loadPaymentDestinations = async () => {
    const { data } = await supabase.from('payment_destinations').select('*').order('sort_order', { ascending: true });
    if (!data) return;
    setPaymentDestinations(data.map((p: any) => ({
      id: p.id, type: p.type, providerName: p.provider_name,
      accountName: p.account_name, accountNumber: p.account_number,
      qrCodeUrl: p.qr_code_url || null, isActive: p.is_active, sortOrder: p.sort_order,
    })));
  };

  useEffect(() => { loadCampaigns(); loadDonations(); loadExpenses(); loadPaymentDestinations(); }, []);

  // Uploads a proof-of-payment (or expense receipt) file into the
  // uploader's own folder in the private bucket and returns the storage
  // path (not a public URL). Reused for both donor proofs and admin
  // expense receipts — same bucket, same signed-URL-on-read pattern.
  const uploadProof = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from(PROOFS_BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) {
      console.error('[donations] proof upload failed', error);
      return null;
    }
    return path;
  };

  // Resolves a stored proof path to a short-lived signed URL for viewing.
  // Safe to call with an already-full URL too (returns it unchanged).
  const getProofUrl = async (path: string): Promise<string | null> => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const { data, error } = await supabase.storage.from(PROOFS_BUCKET).createSignedUrl(path, 60 * 5);
    if (error) {
      console.error('[donations] failed to sign proof url', error);
      return null;
    }
    return data?.signedUrl || null;
  };

  const submitDonation = async (
    d: Omit<DonationRecord, 'id' | 'status' | 'submittedAt' | 'proofUrl' | 'donorId'>,
    proofFile?: File | null
  ) => {
    if (!user) return;
    const campaign = campaigns.find(c => c.name === d.campaign);

    let proofPath: string | null = null;
    if (proofFile) {
      proofPath = await uploadProof(proofFile);
    }

    await supabase.from('donations').insert({
      donor_id: user.id,
      campaign_id: campaign?.id,
      amount: d.amount,
      type: d.type,
      description: d.description || null,
      proof_url: proofPath,
      status: 'pending',
    });
    await loadDonations();
    await loadCampaigns();
  };

  const verifyDonation = async (id: string, verifiedBy: string) => {
    await supabase.from('donations').update({
      status: 'verified',
      verified_by: verifiedBy,
      verified_at: new Date().toISOString(),
    }).eq('id', id);
    await loadDonations();
    await loadCampaigns();
  };

  const rejectDonation = async (id: string, reason: string, verifiedBy: string) => {
    await supabase.from('donations').update({
      status: 'rejected',
      rejection_reason: reason || null,
      verified_by: verifiedBy,
      verified_at: new Date().toISOString(),
    }).eq('id', id);
    await loadDonations();
  };

  const addCampaign = async (c: Omit<Campaign, 'id' | 'current'>) => {
    await supabase.from('donation_campaigns').insert({
      name: c.name, description: c.description, goal_amount: c.target,
      department: c.department, deadline: c.deadline || null, active: c.active,
    });
    await loadCampaigns();
  };

  // Donations that reference this campaign get campaign_id set to null
  // (on delete set null in the FK) rather than being deleted themselves.
  const deleteCampaign = async (id: string) => {
    await supabase.from('donation_campaigns').delete().eq('id', id);
    await loadCampaigns();
    await loadDonations();
  };

  const deleteDonation = async (id: string) => {
    await supabase.from('donations').delete().eq('id', id);
    await loadDonations();
    await loadCampaigns();
  };

  const addExpense = async (campaignId: string, description: string, amount: number, loggedBy: string, receiptFile?: File | null) => {
    let receiptPath: string | null = null;
    if (receiptFile) {
      receiptPath = await uploadProof(receiptFile);
    }
    await supabase.from('campaign_expenses').insert({
      campaign_id: campaignId, description, amount, logged_by: loggedBy, receipt_url: receiptPath,
    });
    await loadExpenses();
  };

  const deleteExpense = async (id: string) => {
    await supabase.from('campaign_expenses').delete().eq('id', id);
    await loadExpenses();
  };

  // QR codes go in the public 'public-assets' bucket (same bucket as the
  // university logo) so donors can view them without a signed URL.
  const uploadPaymentQr = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop() || 'png';
    const path = `payment-qr/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from(PUBLIC_BUCKET).upload(path, file, { upsert: true });
    if (error) {
      console.error('[donations] QR upload failed', error);
      return null;
    }
    const { data } = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

  const addPaymentDestination = async (d: Omit<PaymentDestination, 'id' | 'sortOrder' | 'qrCodeUrl'>, qrFile?: File | null) => {
    let qrCodeUrl: string | null = null;
    if (qrFile) qrCodeUrl = await uploadPaymentQr(qrFile);
    const nextSortOrder = paymentDestinations.length
      ? Math.max(...paymentDestinations.map(p => p.sortOrder)) + 1
      : 0;
    await supabase.from('payment_destinations').insert({
      type: d.type, provider_name: d.providerName, account_name: d.accountName,
      account_number: d.accountNumber, qr_code_url: qrCodeUrl, is_active: d.isActive,
      sort_order: nextSortOrder,
    });
    await loadPaymentDestinations();
  };

  const updatePaymentDestination = async (id: string, d: Omit<PaymentDestination, 'id' | 'sortOrder' | 'qrCodeUrl'>, qrFile?: File | null) => {
    const patch: Record<string, any> = {
      type: d.type, provider_name: d.providerName, account_name: d.accountName,
      account_number: d.accountNumber, is_active: d.isActive,
    };
    if (qrFile) {
      const url = await uploadPaymentQr(qrFile);
      if (url) patch.qr_code_url = url;
    }
    await supabase.from('payment_destinations').update(patch).eq('id', id);
    await loadPaymentDestinations();
  };

  const deletePaymentDestination = async (id: string) => {
    await supabase.from('payment_destinations').delete().eq('id', id);
    await loadPaymentDestinations();
  };

  // Swaps sort_order with the neighboring entry to move an item up/down
  // the list, rather than renumbering everything.
  const movePaymentDestination = async (id: string, direction: 'up' | 'down') => {
    const sorted = [...paymentDestinations].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex(p => p.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (idx === -1 || swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    await Promise.all([
      supabase.from('payment_destinations').update({ sort_order: b.sortOrder }).eq('id', a.id),
      supabase.from('payment_destinations').update({ sort_order: a.sortOrder }).eq('id', b.id),
    ]);
    await loadPaymentDestinations();
  };

  return (
    <Ctx.Provider value={{
      donations, campaigns, expenses, paymentDestinations, submitDonation, verifyDonation, rejectDonation,
      addCampaign, deleteCampaign, deleteDonation, addExpense, deleteExpense, getProofUrl,
      addPaymentDestination, updatePaymentDestination, deletePaymentDestination, movePaymentDestination,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useDonations = () => useContext(Ctx);
