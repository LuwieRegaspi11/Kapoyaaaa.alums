// =====================================================================
// ALUMNI DASHBOARD — top-level page for the "alumni" role.
// Renders DashboardLayout (the header + sidebar) and routes between
// all the alumni/* sub-pages imported below.
// =====================================================================

// -- 1. React & routing ----------------------------------------------
import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router';

// -- 2. App-wide context/state ----------------------------------------
import { useAuth } from './AuthContext';
import { useDonations } from './shared/DonationContext';
import { useEvents } from './shared/EventsContext';

// -- 3. Icons (lucide-react) -------------------------------------------
import { BarChart3, DollarSign, Calendar, Megaphone, BriefcaseBusiness, FileText, Briefcase, CheckCircle, Clock, AlertCircle, Mail, Phone, MapPin, GraduationCap, Building, Edit, Camera, Upload, Heart, TrendingUp, X, Image, Users, Search, ChevronRight, ChevronLeft, Send } from 'lucide-react';

// -- 4. Third-party UI library (Material UI) --------------------------
import { Card, CardContent, TextField, Button, Chip, Avatar, FormControl, InputLabel, Select, MenuItem, Tabs, Tab, Box } from '@mui/material';

// -- 5. Shared components (reused across roles) -----------------------
import DashboardLayout from './shared/DashboardLayout'; // <- the header + sidebar frame
import ProfilePage from './shared/ProfilePage';
import AnnouncementBoard from './shared/AnnouncementBoard';
import JobBoard from './shared/JobBoard';
import EventCalendar from './shared/EventCalendar';

// -- 6. Alumni-only sub-pages (one file per sidebar item, routed below) -
import AlumniDashboardHome from './alumni/AlumniDashboardHome';
import AlumniProfile from './alumni/AlumniProfile';
import DonationPortal from './alumni/DonationPortal';
import FundTransparency from './alumni/FundTransparency';
import EventsView from './alumni/EventsView';
import TracerSurveyAlumni from './alumni/TracerSurveyAlumni';

// Sidebar nav links shown for this role (label, icon, and URL path)
const NAV_ITEMS = [
  { label: 'Dashboard',              icon: <BarChart3 className="w-4 h-4" />,       path: '' },
{ label: 'Donation Center',        icon: <DollarSign className="w-4 h-4" />,       path: 'donations' },
  { label: 'Events / Calendar',      icon: <Calendar className="w-4 h-4" />,         path: 'events' },
  { label: 'Announcements',          icon: <Megaphone className="w-4 h-4" />,        path: 'announcements' },
  { label: 'Job Board',              icon: <BriefcaseBusiness className="w-4 h-4" />,path: 'jobs' },
];

// Paths a pending (not-yet-approved) account can't use. Only the
// dashboard itself stays open while pending — everything else unlocks
// once the alumni office approves the account.
const RESTRICTED_WHEN_PENDING = ['donations', 'jobs', 'surveys', 'events', 'announcements'];

function PendingBanner() {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-amber-800">Your account is pending approval</p>
        <p className="text-xs text-amber-700 mt-0.5">
          You can view your dashboard now. Donations, events, announcements, job postings, and the tracer survey unlock once the alumni office approves your account.
        </p>
      </div>
    </div>
  );
}

function RestrictedPage({ feature }: { feature: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-4">
      <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-4">
        <Clock className="w-7 h-7 text-amber-500" />
      </div>
      <h3 className="font-bold text-gray-800 mb-1">Available After Approval</h3>
      <p className="text-sm text-gray-500 max-w-sm">
        {feature} unlocks once the alumni office approves your account. This is usually quick — check back soon.
      </p>
    </div>
  );
}

export default function AlumniDashboard() {
  const { user } = useAuth();
  const pending = user?.registrationStatus === 'pending';

  const navItems = NAV_ITEMS.map(item => ({
    ...item,
    locked: pending && RESTRICTED_WHEN_PENDING.includes(item.path),
    lockedMessage: 'Available once your account is approved',
  }));

  return (
    <DashboardLayout
      title="Alumni Portal"
      basePath="alumni"
      navItems={navItems}
      // HEADER / SIDEBAR COLOR FOR THE ALUMNI ROLE — edit these two
      // lines to change the accent color shown only when logged in
      // as alumni. (Global site colors live in src/styles/theme.css.)
      accentColor="#2B5BA8"
      accentGradient="linear-gradient(135deg, #1B3A6B 0%, #2B5BA8 55%, #5B9BD5 100%)"
    >
      {pending && <PendingBanner />}
      <Routes>
        <Route index element={<AlumniDashboardHome />} />
        <Route path="profile"       element={<ProfilePage />} />
        <Route path="donations"     element={pending ? <RestrictedPage feature="The Donation Center" /> : <DonationPortal />} />
        <Route path="donations/transparency" element={pending ? <RestrictedPage feature="The Donation Center" /> : <FundTransparency />} />
        <Route path="surveys"       element={pending ? <RestrictedPage feature="The tracer survey" /> : <TracerSurveyAlumni />} />
        <Route path="events"        element={pending ? <RestrictedPage feature="Events / Calendar" /> : <EventsView />} />
        <Route path="announcements" element={pending ? <RestrictedPage feature="Announcements" /> : <AnnouncementBoard role="alumni" department={user?.department} userName={user?.name} />} />
        <Route path="jobs"          element={pending ? <RestrictedPage feature="The Job Board" /> : <JobBoard role="alumni" department={user?.department} userName={user?.name} />} />
      </Routes>
    </DashboardLayout>
  );
}