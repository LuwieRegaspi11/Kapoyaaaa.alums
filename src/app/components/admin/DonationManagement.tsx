import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../AuthContext';

import { Users, TrendingUp, DollarSign, FileText, Calendar, LogOut, BarChart3, Shield, Bell, UserCheck, UserCog, ChevronRight, Menu, X, Megaphone, Building2, Settings, BookOpen, Sun, Moon, User, Search, Download, UserPlus, Eye, Edit, Trash2, FileSpreadsheet, Archive, CheckCircle, Filter, Plus, Pin, XCircle, Power, Clock, MapPin, Upload, GraduationCap, Globe, CreditCard, Mail, Save, Phone, AtSign, Link, Palette, Send, RefreshCw, Receipt, Image } from 'lucide-react';
import { useDarkMode } from '../shared/DarkModeContext';
import { useNotifications } from '../shared/NotificationContext';
import NotificationPanel from '../shared/NotificationPanel';
import JobBoard from '../shared/JobBoard';
import ProfilePage from '../shared/ProfilePage';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Button, Select, MenuItem, FormControl, InputLabel, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent, Avatar, LinearProgress, Tabs, Tab, Box } from '@mui/material';
import { useDonations } from '../shared/DonationContext';
import EventCalendar from '../shared/EventCalendar';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

// ================= [ADMIN: DONATIONMANAGEMENT] =================

const statusConfig = {
  Pending:  { color: 'bg-orange-100 text-orange-700', icon: <Clock className="w-3.5 h-3.5" /> },
  Verified: { color: 'bg-green-100 text-green-700',   icon: <CheckCircle className="w-3.5 h-3.5" /> },
  Rejected: { color: 'bg-red-100 text-red-700',       icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function DonationManagement() {
  const { user } = useAuth();
  const { donations, campaigns, expenses, verifyDonation, rejectDonation, addCampaign, deleteCampaign, deleteDonation, addExpense, deleteExpense, getProofUrl } = useDonations();
  const { trigger } = useNotifications();
  const [tab, setTab] = useState<'transactions' | 'campaigns'>('transactions');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDept, setFilterDept] = useState('All');
  const [viewProof, setViewProof] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; donorId: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ name: '', description: '', target: '', department: 'All', deadline: '' });
  const [deleteCampaignTarget, setDeleteCampaignTarget] = useState<{ id: string; name: string } | null>(null);
  const [expenseCampaign, setExpenseCampaign] = useState<{ id: string; name: string } | null>(null);
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '' });
  const [expenseReceiptFile, setExpenseReceiptFile] = useState<File | null>(null);
  const [expenseReceiptFileName, setExpenseReceiptFileName] = useState('');
  const [loggingExpense, setLoggingExpense] = useState(false);
  const [deleteDonationTarget, setDeleteDonationTarget] = useState<string | null>(null);

  const filtered = donations.filter(d => {
    const matchStatus = filterStatus === 'All' || d.status === filterStatus;
    const matchDept = filterDept === 'All' || d.department === filterDept;
    return matchStatus && matchDept;
  });

  const pending = donations.filter(d => d.status === 'Pending').length;
  const totalVerified = donations.filter(d => d.status === 'Verified').reduce((s, d) => s + d.amount, 0);

  const handleVerify = (donation: (typeof donations)[number]) => {
    verifyDonation(donation.id, user?.name || 'Admin');
    trigger({
      title: 'Donation Verified',
      message: `Your donation of ${donation.type === 'Cash' ? `₱${donation.amount.toLocaleString()}` : donation.description || 'your In-Kind donation'} to ${donation.campaign} has been verified. Thank you for your support!`,
      type: 'success',
      targetUserId: donation.donorId,
    });
  };

  const handleReject = () => {
    if (!rejectTarget) return;
    rejectDonation(rejectTarget.id, rejectReason, user?.name || 'Admin');
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

  const handleAddCampaign = () => {
    addCampaign({ name: campaignForm.name, description: campaignForm.description, target: parseInt(campaignForm.target) || 0, department: campaignForm.department, deadline: campaignForm.deadline, active: true });
    setShowCampaignForm(false);
    setCampaignForm({ name: '', description: '', target: '', department: 'All', deadline: '' });
  };

  const handleDeleteCampaign = () => {
    if (!deleteCampaignTarget) return;
    deleteCampaign(deleteCampaignTarget.id);
    setDeleteCampaignTarget(null);
  };

  const handleExpenseReceipt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExpenseReceiptFileName(file.name);
    setExpenseReceiptFile(file);
  };

  const handleLogExpense = async () => {
    if (!expenseCampaign || !expenseForm.description || !expenseForm.amount) return;
    setLoggingExpense(true);
    await addExpense(expenseCampaign.id, expenseForm.description, parseFloat(expenseForm.amount) || 0, user?.name || 'Admin', expenseReceiptFile);
    setLoggingExpense(false);
    setExpenseForm({ description: '', amount: '' });
    setExpenseReceiptFile(null); setExpenseReceiptFileName('');
  };

  const handleDeleteDonation = () => {
    if (!deleteDonationTarget) return;
    deleteDonation(deleteDonationTarget);
    setDeleteDonationTarget(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Donation Management</h2>
          <p className="text-sm text-gray-500">Manage campaigns, verify transactions, and generate reports</p>
        </div>
        {tab === 'campaigns' && (
          <button onClick={() => setShowCampaignForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#1B3A6B,#2B5BA8)' }}>
            <Plus className="w-4 h-4" /> New Campaign
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Received', value: `₱${totalVerified.toLocaleString()}`, color: '#059669', icon: <DollarSign className="w-5 h-5" /> },
          { label: 'Pending Verification', value: pending, color: '#d97706', icon: <Clock className="w-5 h-5" /> },
          { label: 'Active Campaigns', value: campaigns.filter(c => c.active).length, color: '#2B5BA8', icon: <TrendingUp className="w-5 h-5" /> },
          { label: 'Total Donors', value: new Set(donations.map(d => d.alumniEmail)).size, color: '#7c3aed', icon: <Users className="w-5 h-5" /> },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4" style={{ borderLeftWidth: 3, borderLeftColor: s.color }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{s.label}</span>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['transactions', 'campaigns'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'transactions' && (
        <div className="space-y-4">
          {pending > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-orange-800">{pending} donation{pending > 1 ? 's' : ''} pending verification — review proof of payment below.</p>
            </div>
          )}
          <div className="flex gap-3 flex-wrap">
            {['All','Pending','Verified','Rejected'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filterStatus === s ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                style={filterStatus === s ? { background: 'linear-gradient(135deg,#1B3A6B,#2B5BA8)' } : {}}>
                {s}
              </button>
            ))}
            <div className="w-px bg-gray-200 mx-1" />
            {['All','CSE','CTHM','BAA'].map(d => (
              <button key={d} onClick={() => setFilterDept(d)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filterDept === d ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {d}
              </button>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-14 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3"><DollarSign className="w-7 h-7 text-gray-300" /></div>
                <p className="font-semibold text-gray-500">No transactions found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>{['Donor','Dept','Campaign','Amount','Type','Submitted','Status','Proof','Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(d => (
                      <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-800">{d.alumniName}</p>
                          <p className="text-xs text-gray-400">{d.alumniEmail}</p>
                        </td>
                        <td className="px-4 py-3"><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{d.department}</span></td>
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
                          <div className="flex gap-1">
                            {d.status === 'Pending' && (
                              <>
                                <button onClick={() => handleVerify(d)} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"><CheckCircle className="w-4 h-4" /></button>
                                <button onClick={() => setRejectTarget({ id: d.id, donorId: d.donorId })} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><XCircle className="w-4 h-4" /></button>
                              </>
                            )}
                            <button onClick={() => setDeleteDonationTarget(d.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'campaigns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.length === 0 ? (
            <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center py-14 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3"><TrendingUp className="w-7 h-7 text-gray-300" /></div>
              <p className="font-semibold text-gray-500">No campaigns yet</p>
              <p className="text-sm text-gray-400 mt-1">Create your first fundraising campaign.</p>
            </div>
          ) : campaigns.map(c => {
            const pct = Math.min((c.current / c.target) * 100, 100);
            const campaignExpenses = expenses.filter(e => e.campaignId === c.id);
            const spent = campaignExpenses.reduce((s, e) => s + e.amount, 0);
            const remaining = c.current - spent;
            return (
              <div key={c.id} className={`bg-white rounded-xl border shadow-sm p-5 ${!c.active ? 'opacity-60 border-gray-100' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
                  <h3 className="font-bold text-gray-800">{c.name}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.active ? 'Active' : 'Closed'}</span>
                    <button
                      onClick={() => setExpenseCampaign({ id: c.id, name: c.name })}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors text-xs font-semibold"
                      title="Log expense"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Log Expense</span>
                    </button>
                    <button
                      onClick={() => setDeleteCampaignTarget({ id: c.id, name: c.name })}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors text-xs font-semibold"
                      title="Delete campaign"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-3">{c.description}</p>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>₱{c.current.toLocaleString()} raised</span>
                  <span>Goal: ₱{c.target.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#1B3A6B,#2B5BA8)' }} />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Spent: <span className="font-semibold text-gray-700">₱{spent.toLocaleString()}</span></span>
                  <span>Remaining: <span className="font-semibold text-gray-700">₱{remaining.toLocaleString()}</span></span>
                </div>
                <p className="text-xs font-semibold text-gray-600">{pct.toFixed(0)}% funded · {c.department === 'All' ? 'All Alumni' : c.department}</p>
                {c.deadline && <p className="text-xs text-gray-400 mt-1">Deadline: {c.deadline}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Proof viewer */}
      {viewProof && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setViewProof(null)}>
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewProof(null)} className="absolute -top-10 right-0 text-white"><X className="w-6 h-6" /></button>
            <img src={viewProof} alt="Proof" className="w-full rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-gray-800">Reject Donation</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="Reason (optional)..."
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none resize-none" />
            <div className="flex gap-3">
              <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700">Cancel</button>
              <button onClick={handleReject} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600">Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Log expense modal */}
      {expenseCampaign && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
              <div>
                <h3 className="font-bold text-gray-800">Log Expense</h3>
                <p className="text-xs text-gray-400">{expenseCampaign.name}</p>
              </div>
              <button onClick={() => { setExpenseCampaign(null); setExpenseForm({ description: '', amount: '' }); setExpenseReceiptFile(null); setExpenseReceiptFileName(''); }}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">What was it spent on? <span className="text-red-500">*</span></label>
                <input value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Printed 200 scholarship certificates"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Amount (₱) <span className="text-red-500">*</span></label>
                <input type="number" min="0" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="e.g. 5000"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Receipt / Invoice <span className="text-gray-400 font-normal">(optional)</span></label>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  {expenseReceiptFile ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <Image className="w-5 h-5" />
                      <span className="text-sm font-semibold">{expenseReceiptFileName}</span>
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-400" />
                      <span className="text-sm text-gray-500">Click to attach a receipt/invoice</span>
                      <span className="text-xs text-gray-400">JPG, PNG supported</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleExpenseReceipt} />
                </label>
              </div>
              <p className="text-xs text-gray-400">This is visible to alumni on their Fund Transparency dashboard, so keep the description clear.</p>

              {expenses.filter(e => e.campaignId === expenseCampaign.id).length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Logged so far</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {expenses.filter(e => e.campaignId === expenseCampaign.id).map(e => (
                      <div key={e.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                        <div className="min-w-0 pr-2">
                          <p className="text-gray-700 truncate">{e.description}</p>
                          <p className="text-gray-400">{e.spentAt}{e.loggedBy ? ` · ${e.loggedBy}` : ''}</p>
                          {e.receiptUrl && (
                            <button onClick={() => handleViewProof(e.receiptUrl)} className="flex items-center gap-1 text-blue-600 hover:underline mt-0.5">
                              <Eye className="w-3 h-3" /> View receipt
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-semibold text-gray-700">₱{e.amount.toLocaleString()}</span>
                          <button onClick={() => deleteExpense(e.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t flex-shrink-0">
              <button onClick={() => { setExpenseCampaign(null); setExpenseForm({ description: '', amount: '' }); setExpenseReceiptFile(null); setExpenseReceiptFileName(''); }} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">Close</button>
              <button onClick={handleLogExpense}
                disabled={loggingExpense || !expenseForm.description || !expenseForm.amount}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#1B3A6B,#2B5BA8)' }}>
                {loggingExpense ? 'Adding…' : 'Add Expense'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete campaign confirm */}
      {deleteCampaignTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-gray-800">Delete Campaign</h3>
            <p className="text-sm text-gray-500">
              Delete <span className="font-semibold text-gray-700">"{deleteCampaignTarget.name}"</span>? Any existing donations linked to it will be kept but unlinked from this campaign. This can't be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteCampaignTarget(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700">Cancel</button>
              <button onClick={handleDeleteCampaign} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete donation confirm */}
      {deleteDonationTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-gray-800">Delete Transaction</h3>
            <p className="text-sm text-gray-500">This will permanently remove this donation record. This can't be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteDonationTarget(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700">Cancel</button>
              <button onClick={handleDeleteDonation} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* New campaign form */}
      {showCampaignForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-gray-800">New Campaign</h3>
              <button onClick={() => setShowCampaignForm(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Campaign Name', key: 'name', placeholder: 'e.g. Scholarship Fund 2026' },
                { label: 'Description', key: 'description', placeholder: 'Brief description' },
                { label: 'Fundraising Target (₱)', key: 'target', placeholder: 'e.g. 200000' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">{f.label}</label>
                  <input value={(campaignForm as any)[f.key]} onChange={e => setCampaignForm(p => ({...p, [f.key]: e.target.value}))}
                    placeholder={f.placeholder} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400" />
                </div>
              ))}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Department</label>
                  <select value={campaignForm.department} onChange={e => setCampaignForm(p => ({...p, department: e.target.value}))}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400">
                    {['All','CSE','CTHM','BAA'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Deadline</label>
                  <input type="date" value={campaignForm.deadline} onChange={e => setCampaignForm(p => ({...p, deadline: e.target.value}))}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowCampaignForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddCampaign} disabled={!campaignForm.name || !campaignForm.target}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#1B3A6B,#2B5BA8)' }}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
