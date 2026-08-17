import React from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../AuthContext';
import { useDonations } from './DonationContext';
import { useEvents } from './EventsContext';
import { DollarSign, Calendar, Megaphone, Briefcase, Users, FileText, Clock, Shield } from 'lucide-react';

interface QuickLink { label: string; desc: string; icon: React.ReactNode; path: string; color: string; }

function DashboardBanner({ title, subtitle, gradient }: { title: string; subtitle: string; gradient: string }) {
  return (
    <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: gradient }}>
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
      <p className="text-white/70 text-sm mb-1">Welcome back,</p>
      <h2 className="text-2xl font-bold mb-1">{title}</h2>
      <p className="text-white/60 text-sm">{subtitle}</p>
    </div>
  );
}

function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4" style={{ borderLeftWidth: 3, borderLeftColor: color }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{label}</span>
        <span style={{ color }}>{icon}</span>
      </div>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

function QuickLinkGrid({ links, basePath }: { links: QuickLink[]; basePath: string }) {
  const navigate = useNavigate();
  return (
    <div>
      <h3 className="font-bold text-gray-800 mb-3">Quick Access</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
        {links.map((q, i) => (
          <button key={i} onClick={() => navigate(`/${basePath}/${q.path}`)}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3" style={{ background: q.color }}>
              {q.icon}
            </div>
            <p className="font-bold text-gray-800 text-sm">{q.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{q.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── FACULTY DASHBOARD HOME ── */
export function FacultyDashboardHome() {
  const { user } = useAuth();
  const { donations } = useDonations();
  const { events } = useEvents();

  const deptDonations = donations.filter(d => d.department === user?.department);
  const pendingVerify = deptDonations.filter(d => d.status === 'Pending').length;
  const upcomingEvents = events.filter(e => e.status === 'Upcoming' && (e.department === user?.department || e.department === 'All')).length;

  const links: QuickLink[] = [
    { label: 'Alumni Directory', desc: 'View department alumni records', icon: <Users className="w-5 h-5" />, path: '', color: '#2B5BA8' },
    { label: 'Tracer Surveys', desc: 'View survey responses', icon: <FileText className="w-5 h-5" />, path: 'surveys', color: '#7c3aed' },
    { label: 'Donation Center', desc: 'Monitor & verify donations', icon: <DollarSign className="w-5 h-5" />, path: 'donations', color: '#059669' },
    { label: 'Event Calendar', desc: 'Schedule department events', icon: <Calendar className="w-5 h-5" />, path: 'calendar', color: '#0891b2' },
    { label: 'Announcements', desc: 'Post department updates', icon: <Megaphone className="w-5 h-5" />, path: 'announcements', color: '#d97706' },
    { label: 'Job Board', desc: 'Post and manage job listings', icon: <Briefcase className="w-5 h-5" />, path: 'jobs', color: '#dc2626' },
  ];

  return (
    <div className="space-y-6 w-full">
      <DashboardBanner
        title={user?.name || 'Faculty'}
        subtitle={`${user?.department} Department · Faculty Portal`}
        gradient="linear-gradient(135deg, #1B3A6B 0%, #2B5BA8 55%, #5B9BD5 100%)"
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Dept Alumni" value={deptDonations.length > 0 ? '456' : '0'} sub={`${user?.department} graduates`} color="#2B5BA8" icon={<Users className="w-5 h-5" />} />
        <StatCard label="Pending Donations" value={pendingVerify} sub="Needs verification" color="#d97706" icon={<Clock className="w-5 h-5" />} />
        <StatCard label="Upcoming Events" value={upcomingEvents} sub="Department events" color="#7c3aed" icon={<Calendar className="w-5 h-5" />} />
      </div>
      <QuickLinkGrid links={links} basePath="user" />
    </div>
  );
}

/* ── BATCH REP DASHBOARD HOME ── */
export function RepDashboardHome() {
  const { user } = useAuth();
  const { events } = useEvents();
  const upcomingEvents = events.filter(e => e.status === 'Upcoming').length;

  const links: QuickLink[] = [
    { label: 'Alumni Directory', desc: 'View & verify batch members', icon: <Users className="w-5 h-5" />, path: 'verification', color: '#2B5BA8' },
    { label: 'Donation Center', desc: 'Monitor batch donations', icon: <DollarSign className="w-5 h-5" />, path: 'donations', color: '#059669' },
    { label: 'Event Calendar', desc: 'View all alumni events', icon: <Calendar className="w-5 h-5" />, path: 'events', color: '#0891b2' },
    { label: 'Announcements', desc: 'Read latest updates', icon: <Megaphone className="w-5 h-5" />, path: 'announcements', color: '#d97706' },
    { label: 'Job Board', desc: 'View and manage job listings', icon: <Briefcase className="w-5 h-5" />, path: 'jobs', color: '#7c3aed' },
    { label: 'Activity Log', desc: 'Your verification audit trail', icon: <Shield className="w-5 h-5" />, path: 'activity', color: '#374151' },
  ];

  return (
    <div className="space-y-6 w-full">
      <DashboardBanner
        title={user?.name || 'Batch Representative'}
        subtitle={`Batch ${user?.assignedBatchYear} · ${user?.assignedDepartment} · ${user?.assignedProgram} Representative`}
        gradient="linear-gradient(135deg, #1B3A6B 0%, #2B5BA8 55%, #5B9BD5 100%)"
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Assigned Batch" value={user?.assignedBatchYear || '—'} sub={`${user?.assignedDepartment} ${user?.assignedProgram}`} color="#2B5BA8" icon={<Users className="w-5 h-5" />} />
        <StatCard label="Pending Verification" value={0} sub="Batch members" color="#d97706" icon={<Clock className="w-5 h-5" />} />
        <StatCard label="Upcoming Events" value={upcomingEvents} sub="Visible to you" color="#7c3aed" icon={<Calendar className="w-5 h-5" />} />
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-blue-800">Your Role & Responsibilities</p>
          <p className="text-xs text-blue-600 mt-0.5">As Batch Representative, you verify alumni identity for Batch {user?.assignedBatchYear} {user?.assignedDepartment} {user?.assignedProgram}. All your actions are audit-logged per RA 10175.</p>
        </div>
      </div>
      <QuickLinkGrid links={links} basePath="representative" />
    </div>
  );
}
