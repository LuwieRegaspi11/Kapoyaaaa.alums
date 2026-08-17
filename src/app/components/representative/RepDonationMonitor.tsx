import React, { useState } from 'react';
import { Routes, Route } from 'react-router';
import { useAuth } from '../AuthContext';
import { BarChart3, Users, DollarSign, Calendar, Megaphone, BriefcaseBusiness, Shield, CheckCircle, Search, Clock, TrendingUp } from 'lucide-react';
import { Avatar, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import DashboardLayout from '../shared/DashboardLayout';
import ProfilePage from '../shared/ProfilePage';
import EventCalendar from '../shared/EventCalendar';
import AnnouncementBoard from '../shared/AnnouncementBoard';
import JobBoard from '../shared/JobBoard';
import { RepDashboardHome } from '../shared/RoleDashboardHome';
import { useDonations } from '../shared/DonationContext';

// ================= [BATCH REPRESENTATIVE: REPDONATIONMONITOR] =================

export default function RepDonationMonitor() {
  const { user } = useAuth();
  const { donations, campaigns } = useDonations();

  // Batch rep sees their batch's donations (dept-scoped)
  const batchDonations = donations.filter(d => d.department === user?.assignedDepartment);
  const total = batchDonations.filter(d => d.status === 'Verified').reduce((s, d) => s + d.amount, 0);
  const pending = batchDonations.filter(d => d.status === 'Pending').length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Donation Center</h2>
        <p className="text-sm text-gray-500">Monitor donations from <strong>Batch {user?.assignedBatchYear} {user?.assignedDepartment}</strong> alumni</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
        <span className="text-amber-600">👁️</span>
        <p className="text-xs text-amber-700 font-medium">Batch Representatives have <strong>monitoring access only</strong>. Verification of donations is handled by Admin and Faculty.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Total Verified', value: `₱${total.toLocaleString()}`, color: '#059669', icon: <CheckCircle className="w-5 h-5" /> },
          { label: 'Pending Review', value: pending, color: '#d97706', icon: <Clock className="w-5 h-5" /> },
          { label: 'Total Donors', value: new Set(batchDonations.map(d => d.alumniEmail)).size, color: '#2B5BA8', icon: <TrendingUp className="w-5 h-5" /> },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4" style={{ borderLeftWidth: 3, borderLeftColor: s.color }}>
            <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500">{s.label}</span><span style={{ color: s.color }}>{s.icon}</span></div>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Donations list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {batchDonations.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <DollarSign className="w-7 h-7 text-gray-300" />
            </div>
            <h3 className="font-semibold text-gray-500 mb-1">No Donations Yet</h3>
            <p className="text-sm text-gray-400 max-w-xs">No alumni from Batch {user?.assignedBatchYear} {user?.assignedDepartment} have submitted donations yet. Encourage your batch to contribute!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Donor','Campaign','Amount','Type','Date','Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {batchDonations.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-800">{d.alumniName}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{d.campaign}</td>
                    <td className="px-4 py-3 font-bold">{d.type === 'Cash' ? `₱${d.amount.toLocaleString()}` : 'In-Kind'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{d.type}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{d.submittedAt}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        d.status === 'Verified' ? 'bg-green-100 text-green-700' :
                        d.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'}`}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active campaigns */}
      <div>
        <h3 className="font-bold text-gray-800 mb-3">Active Campaigns</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.filter(c => c.active).map(c => {
            const pct = Math.min((c.current / c.target) * 100, 100);
            return (
              <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <h4 className="font-bold text-gray-800 mb-1">{c.name}</h4>
                <p className="text-xs text-gray-500 mb-2">{c.description}</p>
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
    </div>
  );
}
