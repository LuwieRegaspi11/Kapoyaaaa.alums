import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router';
import { useAuth } from '../AuthContext';
import { BarChart3, DollarSign, Calendar, Megaphone, BriefcaseBusiness, FileText, Briefcase, CheckCircle, Clock, AlertCircle, Mail, Phone, MapPin, GraduationCap, Building, Building2, Edit, Camera, Upload, Heart, TrendingUp, X, Image, Users, Search, ChevronRight, ChevronLeft, Send, Copy, Check, Wallet, CreditCard } from 'lucide-react';
import DashboardLayout from '../shared/DashboardLayout';
import ProfilePage from '../shared/ProfilePage';
import AnnouncementBoard from '../shared/AnnouncementBoard';
import JobBoard from '../shared/JobBoard';
import { useDonations } from '../shared/DonationContext';
import { useNotifications } from '../shared/NotificationContext';
import { useEvents } from '../shared/EventsContext';
import { Card, CardContent, TextField, Button, Chip, Avatar, FormControl, InputLabel, Select, MenuItem, Tabs, Tab, Box } from '@mui/material';
import EventCalendar from '../shared/EventCalendar';

// ================= [ALUMNI: DONATIONPORTAL] =================

const statusConfig = {
  Pending:  { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: <Clock className="w-3.5 h-3.5" />, label: 'Pending Verification' },
  Verified: { color: 'bg-green-100 text-green-700 border-green-200',  icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Verified' },
  Rejected: { color: 'bg-red-100 text-red-700 border-red-200',        icon: <AlertCircle className="w-3.5 h-3.5" />, label: 'Rejected' },
};

export default function DonationPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { donations, campaigns, paymentDestinations, submitDonation, getProofUrl } = useDonations();
  const { trigger } = useNotifications();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'Cash', campaign: '', amount: '', description: '' });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofFileName, setProofFileName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});
  const [selectedDestId, setSelectedDestId] = useState<string | null>(null);
  const [copiedDestId, setCopiedDestId] = useState<string | null>(null);

  const activeDestinations = paymentDestinations.filter(d => d.isActive);
  const destTypeIcon = (type: string) => type === 'Bank' ? <Building2 className="w-4 h-4 text-gray-500" /> : type === 'E-Wallet' ? <Wallet className="w-4 h-4 text-gray-500" /> : <CreditCard className="w-4 h-4 text-gray-500" />;

  const copyAccountNumber = (id: string, accountNumber: string) => {
    navigator.clipboard.writeText(accountNumber).then(() => {
      setCopiedDestId(id);
      setTimeout(() => setCopiedDestId(prev => (prev === id ? null : prev)), 2000);
    });
  };

  const myDonations = donations.filter(d => d.alumniEmail === user?.email || d.alumniName === user?.name);
  const totalVerified = myDonations.filter(d => d.status === 'Verified').reduce((s, d) => s + d.amount, 0);
  const pendingCount = myDonations.filter(d => d.status === 'Pending').length;

  // Proof thumbnails are stored as private Storage paths, so resolve each
  // to a short-lived signed URL for display.
  useEffect(() => {
    const missing = myDonations.filter(d => d.proofUrl && !proofUrls[d.id]);
    if (missing.length === 0) return;
    (async () => {
      const entries = await Promise.all(missing.map(async d => [d.id, await getProofUrl(d.proofUrl as string)] as const));
      setProofUrls(prev => {
        const next = { ...prev };
        entries.forEach(([id, url]) => { if (url) next[id] = url; });
        return next;
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myDonations]);

  const handleProof = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFileName(file.name);
    setProofFile(file);
  };

  const handleSubmit = async () => {
    if (!form.campaign || (form.type === 'Cash' && (!form.amount || !proofFile))) return;
    setSubmitting(true);
    await submitDonation({
      alumniName: user?.name || 'Alumni',
      alumniEmail: user?.email || '',
      department: user?.department || 'All',
      campaign: form.campaign || 'General Fund',
      amount: form.type === 'Cash' ? parseInt(form.amount) : 0,
      type: form.type as 'Cash' | 'In-Kind',
      description: form.description,
    }, proofFile);
    // Admin always needs to know; the donor's own faculty rep only needs
    // to know about donations from their own department.
    trigger({
      title: 'Donation Submitted',
      message: `A new donation from ${user?.name || 'an alumnus'} is pending verification.`,
      type: 'info',
      targetRole: 'admin',
    });
    trigger({
      title: 'Donation Submitted',
      message: `A new donation from ${user?.name || 'an alumnus'} is pending verification.`,
      type: 'info',
      targetRole: 'faculty',
      targetDept: user?.department,
    });
    setSubmitting(false);
    setShowForm(false);
    setForm({ type: 'Cash', campaign: '', amount: '', description: '' });
    setProofFile(null); setProofFileName('');
    setSelectedDestId(null);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Donations</h2>
          <p className="text-sm text-gray-500">Support your alma mater through contributions</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#1B3A6B,#2B5BA8)' }}>
          <Heart className="w-4 h-4" /> Make a Donation
        </button>
      </div>

      {/* Link to the Fund Transparency page */}
      <button onClick={() => navigate('/alumni/donations/transparency')}
        className="w-full flex items-center justify-between gap-3 bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 text-left hover:border-blue-200 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-bold text-gray-800">Fund Transparency</p>
            <p className="text-xs text-gray-500">See exactly where every donated peso went, campaign by campaign.</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </button>

      {/* Submission success toast */}
      {submitted && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-800">Donation Submitted!</p>
            <p className="text-xs text-green-600">Your proof of payment is under review. You'll be notified once it's verified.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Donated', value: `₱${totalVerified.toLocaleString()}`, sub: 'Verified contributions', icon: <DollarSign className="w-5 h-5" />, color: '#059669' },
          { label: 'Transactions', value: myDonations.length, sub: 'All time', icon: <TrendingUp className="w-5 h-5" />, color: '#2B5BA8' },
          { label: 'Pending', value: pendingCount, sub: 'Awaiting verification', icon: <Clock className="w-5 h-5" />, color: '#d97706' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4" style={{ borderLeftWidth: 3, borderLeftColor: s.color }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">{s.label}</span>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Active campaigns */}
      <div>
        <h3 className="font-bold text-gray-800 mb-3">Active Campaigns</h3>
        {campaigns.filter(c => c.active).length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3"><Heart className="w-7 h-7 text-gray-300" /></div>
            <p className="font-semibold text-gray-500 mb-1">No Active Campaigns</p>
            <p className="text-sm text-gray-400">Check back later for fundraising campaigns.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.filter(c => c.active).map(c => {
              const pct = Math.min((c.current / c.target) * 100, 100);
              return (
                <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-bold text-gray-800">{c.name}</h4>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{c.department === 'All' ? 'All' : c.department}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{c.description}</p>
                  <div className="mb-1 flex justify-between text-xs text-gray-500">
                    <span>₱{c.current.toLocaleString()} raised</span>
                    <span>Goal: ₱{c.target.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#1B3A6B,#2B5BA8)' }} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-600">{pct.toFixed(0)}% funded</span>
                    {c.deadline && <span className="text-xs text-gray-400">Ends {c.deadline}</span>}
                  </div>
                  <button onClick={() => { setForm(f => ({...f, campaign: c.name})); setShowForm(true); }}
                    className="w-full mt-3 py-2 rounded-xl text-sm font-bold border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors">
                    Donate to this campaign
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* My history */}
      <div>
        <h3 className="font-bold text-gray-800 mb-3">My Donation History</h3>
        {myDonations.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3"><TrendingUp className="w-7 h-7 text-gray-300" /></div>
            <p className="font-semibold text-gray-500 mb-1">No Donations Yet</p>
            <p className="text-sm text-gray-400">Make your first donation to support your alma mater.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myDonations.map(d => {
              const cfg = statusConfig[d.status];
              return (
                <div key={d.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold text-gray-800">{d.campaign}</p>
                        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold border ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {d.type === 'Cash' ? `₱${d.amount.toLocaleString()}` : `In-Kind: ${d.description}`}
                        {' · '}{d.submittedAt}
                      </p>
                      {d.status === 'Rejected' && d.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1">Reason: {d.rejectionReason}</p>
                      )}
                      {d.status === 'Pending' && (
                        <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Your proof of payment is being reviewed by the admin.
                        </p>
                      )}
                      {d.status === 'Verified' && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Verified by {d.verifiedBy} on {d.verifiedAt}
                        </p>
                      )}
                    </div>
                    {d.proofUrl && proofUrls[d.id] && (
                      <div className="flex-shrink-0">
                        <img src={proofUrls[d.id]} alt="proof" className="w-12 h-12 object-cover rounded-lg border border-gray-200" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Donation form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
              <h3 className="font-bold text-gray-800">Make a Donation</h3>
              <button onClick={() => { setShowForm(false); setProofFile(null); setProofFileName(''); setSelectedDestId(null); }}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Donation Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {['Cash', 'In-Kind'].map(t => (
                    <button key={t} onClick={() => setForm(f => ({...f, type: t}))}
                      className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${form.type === t ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {t === 'Cash' ? '💳 Cash / Transfer' : '📦 In-Kind'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Campaign</label>
                <select value={form.campaign} onChange={e => setForm(f => ({...f, campaign: e.target.value}))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400">
                  <option value="">Select a campaign</option>
                  {campaigns.filter(c => c.active).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  <option value="General Fund">General Fund</option>
                </select>
              </div>

              {form.type === 'Cash' ? (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Amount (₱)</label>
                    <input type="number" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))}
                      placeholder="e.g. 1000" className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400" />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Pay To</label>
                    {activeDestinations.length === 0 ? (
                      <p className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-xl p-3">No payment destinations are configured yet. Please contact the alumni office.</p>
                    ) : (
                      <div className="space-y-2">
                        {activeDestinations.map(d => (
                          <div key={d.id} role="button" tabIndex={0} onClick={() => setSelectedDestId(d.id)}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedDestId(d.id); }}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left cursor-pointer transition-colors ${selectedDestId === d.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                            {d.qrCodeUrl ? (
                              <img src={d.qrCodeUrl} alt={`${d.providerName} QR`} className="w-11 h-11 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                            ) : (
                              <div className="w-11 h-11 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">{destTypeIcon(d.type)}</div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-bold text-gray-800 truncate">{d.providerName}</p>
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{d.type}</span>
                              </div>
                              <p className="text-xs text-gray-500 truncate">{d.accountName}</p>
                              <p className="text-xs font-mono text-gray-700">{d.accountNumber}</p>
                            </div>
                            <button type="button" onClick={e => { e.stopPropagation(); copyAccountNumber(d.id, d.accountNumber); }}
                              className={`flex items-center gap-1 flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${copiedDestId === d.id ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                              {copiedDestId === d.id ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-orange-600 font-semibold mt-2">⚠️ Upload your receipt/screenshot below after payment.</p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Proof of Payment <span className="text-red-500">*</span></label>
                    <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-5 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      {proofFile ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <Image className="w-5 h-5" />
                          <span className="text-sm font-semibold">{proofFileName}</span>
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      ) : (
                        <>
                          <Upload className="w-7 h-7 text-gray-400" />
                          <span className="text-sm text-gray-500">Click to upload receipt/screenshot</span>
                          <span className="text-xs text-gray-400">JPG, PNG supported</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleProof} />
                    </label>
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Description of Donation</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3}
                    placeholder="e.g. 10 Computer Science textbooks, 5 desktop computers..." className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400 resize-none" />
                </div>
              )}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t flex-shrink-0">
              <button onClick={() => { setShowForm(false); setProofFile(null); setProofFileName(''); setSelectedDestId(null); }} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmit}
                disabled={submitting || !form.campaign || (form.type === 'Cash' && (!form.amount || !proofFile))}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#1B3A6B,#2B5BA8)' }}>
                {submitting ? 'Submitting…' : 'Submit Donation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
