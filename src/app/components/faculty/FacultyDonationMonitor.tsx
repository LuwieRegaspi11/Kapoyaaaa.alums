import React, { useState } from 'react';
import { Routes, Route } from 'react-router';
import { useAuth } from '../AuthContext';
import { BarChart3, Users, DollarSign, Calendar, Megaphone, BriefcaseBusiness, Search, Download, CheckCircle, XCircle, Clock, Eye, X, TrendingUp, FileText } from 'lucide-react';
import { TextField, Chip } from '@mui/material';
import DashboardLayout from '../shared/DashboardLayout';
import ProfilePage from '../shared/ProfilePage';
import EventCalendar from '../shared/EventCalendar';
import AnnouncementBoard from '../shared/AnnouncementBoard';
import JobBoard from '../shared/JobBoard';
import { FacultyDashboardHome } from '../shared/RoleDashboardHome';
import { useDonations } from '../shared/DonationContext';
import { useNotifications } from '../shared/NotificationContext';

// ================= [FACULTY: FACULTYDONATIONMONITOR] =================

const statusConfig = {
  Pending:  { color: 'bg-orange-100 text-orange-700', icon: <Clock className="w-3.5 h-3.5" /> },
  Verified: { color: 'bg-green-100 text-green-700',   icon: <CheckCircle className="w-3.5 h-3.5" /> },
  Rejected: { color: 'bg-red-100 text-red-700',       icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function FacultyDonationMonitor() {
  const { user } = useAuth();
  const { donations, campaigns, verifyDonation, rejectDonation, getProofUrl } = useDonations();
  const { trigger } = useNotifications();
  const [viewProof, setViewProof] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; donorId: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Faculty sees only their department's donations
  const deptDonations = donations.filter(d => d.department === user?.department);
  const filtered = deptDonations.filter(d => filterStatus === 'All' || d.status === filterStatus);
  const pending = deptDonations.filter(d => d.status === 'Pending').length;
  const totalVerified = deptDonations.filter(d => d.status === 'Verified').reduce((s, d) => s + d.amount, 0);
  const deptCampaigns = campaigns.filter(c => c.department === user?.department || c.department === 'All');

  const handleVerify = (donation: (typeof donations)[number]) => {
    verifyDonation(donation.id, user?.name || 'Faculty');
    trigger({
      title: 'Donation Verified',
      message: `Your donation of ${donation.type === 'Cash' ? `₱${donation.amount.toLocaleString()}` : donation.description || 'your In-Kind donation'} to ${donation.campaign} has been verified. Thank you!`,
      type: 'success',
      targetUserId: donation.donorId,
    });
  };
  const handleReject = () => {
    if (!rejectTarget) return;
    rejectDonation(rejectTarget.id, rejectReason, user?.name || 'Faculty');
    trigger({
      title: 'Donation Update',
      message: rejectReason
        ? `Your donation submission was not approved: ${rejectReason}`
        : 'Your donation submission needs attention. Please check your donation history.',
      type: 'warning',
      targetUserId: rejectTarget.donorId,
    });
    setRejectTarget(null); setRejectReason('');
  };
  const handleViewProof = async (path: string | null) => {
    if (!path) return;
    const url = await getProofUrl(path);
    if (url) setViewProof(url);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Donation Center</h2>
        <p className="text-sm text-gray-500">Monitor and verify donations for the <strong>{user?.department}</strong> department</p>
      </div>

      {/* Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
        <span className="text-amber-600">🔒</span>
        <p className="text-xs text-amber-700 font-medium">You can only view and verify donations from <strong>{user?.department}</strong> alumni. Global donation management is Admin-only.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4" style={{ borderLeftWidth: 3, borderLeftColor: '#059669' }}>
          <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500">Dept. Total Received</span><DollarSign className="w-5 h-5 text-green-600" /></div>
          <p className="text-xl font-bold text-green-700">₱{totalVerified.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4" style={{ borderLeftWidth: 3, borderLeftColor: '#d97706' }}>
          <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500">Pending Review</span><Clock className="w-5 h-5 text-orange-500" /></div>
          <p className="text-xl font-bold text-orange-600">{pending}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4" style={{ borderLeftWidth: 3, borderLeftColor: '#2B5BA8' }}>
          <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500">Active Campaigns</span><TrendingUp className="w-5 h-5 text-blue-600" /></div>
          <p className="text-xl font-bold text-blue-700">{deptCampaigns.filter(c => c.active).length}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['All','Pending','Verified','Rejected'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filterStatus === s ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            style={filterStatus === s ? { background: 'linear-gradient(135deg,#1B3A6B,#2B5BA8)' } : {}}>
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3"><DollarSign className="w-7 h-7 text-gray-300" /></div>
            <p className="font-semibold text-gray-500">No donations found</p>
            <p className="text-sm text-gray-400 mt-1">No {user?.department} alumni have submitted donations yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Donor','Campaign','Amount','Type','Date','Status','Proof','Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{d.alumniName}</p>
                      <p className="text-xs text-gray-400">{d.alumniEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{d.campaign}</td>
                    <td className="px-4 py-3 font-bold text-gray-800">{d.type === 'Cash' ? `₱${d.amount.toLocaleString()}` : 'In-Kind'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{d.type}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{d.submittedAt}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold w-fit ${statusConfig[d.status].color}`}>
                        {statusConfig[d.status].icon} {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {d.proofUrl ? (
                        <button onClick={() => handleViewProof(d.proofUrl)} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      ) : <span className="text-xs text-gray-400">N/A</span>}
                    </td>
                    <td className="px-4 py-3">
                      {d.status === 'Pending' && (
                        <div className="flex gap-1">
                          <button onClick={() => handleVerify(d)} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"><CheckCircle className="w-4 h-4" /></button>
                          <button onClick={() => setRejectTarget({ id: d.id, donorId: d.donorId })} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><XCircle className="w-4 h-4" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Campaign progress for dept */}
      {deptCampaigns.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-800 mb-3">Department Campaigns</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deptCampaigns.filter(c => c.active).map(c => {
              const pct = Math.min((c.current / c.target) * 100, 100);
              return (
                <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h4 className="font-bold text-gray-800 mb-1">{c.name}</h4>
                  <p className="text-xs text-gray-500 mb-3">{c.description}</p>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>₱{c.current.toLocaleString()}</span><span>₱{c.target.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#1B3A6B,#2B5BA8)' }} />
                  </div>
                  <p className="text-xs font-semibold text-gray-600 mt-1">{pct.toFixed(0)}% funded</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewProof && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setViewProof(null)}>
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewProof(null)} className="absolute -top-10 right-0 text-white"><X className="w-6 h-6" /></button>
            <img src={viewProof} alt="Proof" className="w-full rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-gray-800">Reject Donation</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="Reason (optional)..."
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none resize-none" />
            <div className="flex gap-3">
              <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold">Cancel</button>
              <button onClick={handleReject} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
