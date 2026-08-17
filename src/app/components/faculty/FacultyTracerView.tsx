import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router';
import { useAuth } from '../AuthContext';
import { supabase } from '../../../lib/supabaseClient';
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

// ================= [FACULTY: FACULTYTRACERVIEW] =================

interface TracerRow {
  name: string; program: string; batchYear: number;
  industry: string; relatedToProgram: string; completed: boolean;
}

export default function FacultyTracerView() {
  const { user } = useAuth();
  const [mockResponses, setResponses] = useState<TracerRow[]>([]);
  const [deptAlumniCount, setDeptAlumniCount] = useState(0);

  useEffect(() => {
    if (!user?.department) return;
    (async () => {
      const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'alumni').eq('department', user.department);
      setDeptAlumniCount(count || 0);

      const { data } = await supabase
        .from('tracer_survey_responses')
        .select('answers, submitted_at, respondent:profiles!inner(name, program, batch_year, department)')
        .eq('respondent.department', user.department);
      setResponses((data || []).map((r: any) => {
        const a = r.answers || {};
        return {
          name: r.respondent?.name || 'Unknown', program: r.respondent?.program || '—', batchYear: r.respondent?.batch_year || 0,
          industry: a.q4 || '—', relatedToProgram: a.q3 || '—', completed: true,
        };
      }));
    })();
  }, [user?.department]);

  const completed = mockResponses.filter(r => r.completed).length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Tracer Surveys</h2>
        <p className="text-sm text-gray-500">View survey responses from <strong>{user?.department}</strong> alumni</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
        <span className="text-amber-600">🔒</span>
        <p className="text-xs text-amber-700 font-medium">Faculty can view survey reports for their department only. Creating surveys is an Admin function.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Responses', value: mockResponses.length, color: '#2B5BA8', icon: <FileText className="w-5 h-5" /> },
          { label: 'Completed', value: completed, color: '#059669', icon: <CheckCircle className="w-5 h-5" /> },
          { label: 'Pending Survey', value: Math.max(0, deptAlumniCount - completed), color: '#d97706', icon: <Users className="w-5 h-5" /> },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4" style={{ borderLeftWidth: 3, borderLeftColor: s.color }}>
            <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500">{s.label}</span><span style={{ color: s.color }}>{s.icon}</span></div>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Responses table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Individual Responses</h3>
        </div>
        {mockResponses.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3"><FileText className="w-7 h-7 text-gray-300" /></div>
            <p className="font-semibold text-gray-500">No Survey Responses Yet</p>
            <p className="text-sm text-gray-400 mt-1">No alumni from {user?.department} have completed the survey.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Name','Program','Batch','Industry','Related to Program','Survey'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {mockResponses.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-800">{r.name}</td>
                    <td className="px-4 py-3 text-gray-600">{r.program}</td>
                    <td className="px-4 py-3 text-gray-600">{r.batchYear}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.industry}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.relatedToProgram}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.completed ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {r.completed ? '✓ Done' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
