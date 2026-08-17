import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Heart, Eye, X } from 'lucide-react';
import { useDonations } from '../shared/DonationContext';

// =====================================================================
// FUND TRANSPARENCY — its own page (not just a tab) so donors have a
// direct, shareable place to see what happened to their money: total
// raised, total allocated/spent, remaining balance, and an itemized
// breakdown per campaign. Reads the same campaigns/expenses data admin
// logs in Donation Management — nothing separate to wire up. Expense
// rows the admin attached a receipt to get a "View receipt" link,
// resolved to a short-lived signed URL on demand.
// =====================================================================
export default function FundTransparency() {
  const navigate = useNavigate();
  const { campaigns, donations, expenses, getProofUrl } = useDonations();
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [loadingReceiptId, setLoadingReceiptId] = useState<string | null>(null);

  const handleViewReceipt = async (id: string, path: string) => {
    setLoadingReceiptId(id);
    const url = await getProofUrl(path);
    setLoadingReceiptId(null);
    if (url) setReceiptUrl(url);
  };

  const totalRaised = campaigns.reduce((s, c) => s + c.current, 0);
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const totalRemaining = totalRaised - totalSpent;
  const totalDonors = new Set(donations.filter(d => d.status === 'Verified').map(d => d.alumniEmail)).size;

  return (
    <div className="space-y-6 w-full">
      <div>
        <button onClick={() => navigate('/alumni/donations')}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700 mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to Donation Center
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Fund Transparency</h2>
        <p className="text-sm text-gray-500">See exactly where every donated peso went — updated live from the alumni office's records.</p>
      </div>

      {/* Site-wide summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Funds Raised', value: `₱${totalRaised.toLocaleString()}`, sub: `From ${totalDonors} donor${totalDonors === 1 ? '' : 's'}`, color: '#059669' },
          { label: 'Total Allocated / Spent', value: `₱${totalSpent.toLocaleString()}`, sub: 'Across all campaigns', color: '#d97706' },
          { label: 'Remaining Balance', value: `₱${totalRemaining.toLocaleString()}`, sub: 'Not yet allocated', color: '#2B5BA8' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4" style={{ borderLeftWidth: 3, borderLeftColor: s.color }}>
            <span className="text-sm text-gray-500">{s.label}</span>
            <p className="text-xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400">
        This page reflects every campaign's real numbers as logged by the alumni office — updated the moment funds are raised or spent.
      </p>

      {/* Per-campaign breakdown */}
      {campaigns.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3"><Heart className="w-7 h-7 text-gray-300" /></div>
          <p className="font-semibold text-gray-500">No campaigns yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map(c => {
            const campaignExpenses = expenses.filter(e => e.campaignId === c.id).sort((a, b) => (a.spentAt < b.spentAt ? 1 : -1));
            const spent = campaignExpenses.reduce((s, e) => s + e.amount, 0);
            const remaining = c.current - spent;
            const spentPct = c.current > 0 ? Math.min((spent / c.current) * 100, 100) : 0;
            return (
              <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                  <h3 className="font-bold text-gray-800">{c.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.active ? 'Active' : 'Closed'}</span>
                </div>
                <p className="text-xs text-gray-500 mb-4">{c.description}</p>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-400">Raised</p>
                    <p className="text-sm font-bold text-emerald-600">₱{c.current.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Allocated</p>
                    <p className="text-sm font-bold text-amber-600">₱{spent.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Remaining</p>
                    <p className="text-sm font-bold text-blue-600">₱{remaining.toLocaleString()}</p>
                  </div>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
                  <div className="h-2 rounded-full bg-amber-400" style={{ width: `${spentPct}%` }} />
                </div>

                {campaignExpenses.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No expenses logged yet — the full amount raised is still available.</p>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Where the money went</p>
                    <div className="space-y-1.5">
                      {campaignExpenses.map(e => (
                        <div key={e.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                          <div className="min-w-0 pr-2">
                            <p className="text-gray-700 truncate">{e.description}</p>
                            <p className="text-gray-400">{e.spentAt}</p>
                            {e.receiptUrl && (
                              <button onClick={() => handleViewReceipt(e.id, e.receiptUrl as string)}
                                disabled={loadingReceiptId === e.id}
                                className="flex items-center gap-1 text-blue-600 hover:underline mt-0.5 disabled:opacity-50">
                                <Eye className="w-3 h-3" /> {loadingReceiptId === e.id ? 'Loading…' : 'View receipt'}
                              </button>
                            )}
                          </div>
                          <span className="font-semibold text-gray-700 flex-shrink-0">₱{e.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Receipt viewer */}
      {receiptUrl && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setReceiptUrl(null)}>
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setReceiptUrl(null)} className="absolute -top-10 right-0 text-white"><X className="w-6 h-6" /></button>
            <img src={receiptUrl} alt="Expense receipt" className="w-full rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
