import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useDarkMode } from './DarkModeContext';
import { supabase } from '../../../lib/supabaseClient';
import { Sun, Moon, Camera, Mail, Phone, MapPin, Calendar, GraduationCap, Building, Shield, Pencil, Check, X, AtSign, Briefcase } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { dark, toggle } = useDarkMode();
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    phone: user?.phone || '',
    address: user?.address || '',
    currentPosition: user?.currentPosition || '',
    currentCompany: user?.currentCompany || '',
    username: user?.username || '',
    position: user?.position || '',
  });

  const profileImage = user?.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=1B3A6B&color=fff&bold=true`;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `avatars/${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from('public-assets').upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('public-assets').getPublicUrl(path);
      await updateProfile({ profileImage: `${data.publicUrl}?t=${Date.now()}` });
    } else {
      console.error('[profile] avatar upload failed', error);
    }
    setUploading(false);
  };

  const startEditing = () => {
    setForm({
      phone: user?.phone || '', address: user?.address || '',
      currentPosition: user?.currentPosition || '', currentCompany: user?.currentCompany || '',
      username: user?.username || '', position: user?.position || '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({
      phone: form.phone, address: form.address,
      currentPosition: form.currentPosition, currentCompany: form.currentCompany,
      ...(user?.role === 'admin' ? { username: form.username } : {}),
      ...(user?.role === 'faculty' ? { position: form.position } : {}),
    });
    setSaving(false);
    setEditing(false);
  };

  const card = dark
    ? 'bg-gray-800 border border-gray-700 rounded-xl p-5'
    : 'bg-white border border-gray-100 rounded-xl p-5 shadow-sm';

  const label = dark ? 'text-gray-400 text-xs' : 'text-gray-500 text-xs';
  const value = dark ? 'text-white text-sm font-medium' : 'text-gray-800 text-sm font-medium';
  const heading = dark ? 'text-white font-bold text-base mb-4' : 'text-gray-800 font-bold text-base mb-4';
  const inputCls = `w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 transition-colors ${
    dark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-800'
  }`;

  const employment = user?.currentPosition
    ? `${user.currentPosition}${user.currentCompany ? ` at ${user.currentCompany}` : ''}`
    : '—';

  return (
    <div className="space-y-5 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center items-start justify-between gap-3">
        <div>
          <h2 className={dark ? 'text-2xl font-bold text-white' : 'text-2xl font-bold text-gray-800'}>
            My Profile
          </h2>
          <p className={dark ? 'text-gray-400 text-sm' : 'text-gray-500 text-sm'}>
            Manage your account information and preferences
          </p>
        </div>
      </div>

      {/* Profile card */}
      <div className={card}>
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <img
              src={profileImage}
              alt={user?.name}
              className="w-24 h-24 rounded-full object-cover border-4"
              style={{ borderColor: dark ? '#374151' : '#e5e7eb' }}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=1B3A6B&color=fff&bold=true`;
              }}
            />
            <label
              htmlFor="profile-upload"
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
              style={{ background: 'linear-gradient(135deg, #1B3A6B, #2B5BA8)' }}
            >
              <Camera className="w-3.5 h-3.5 text-white" />
              <input id="profile-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
          </div>
          <div>
            <h3 className={dark ? 'text-xl font-bold text-white' : 'text-xl font-bold text-gray-800'}>{user?.name}</h3>
            <p className={dark ? 'text-gray-400 text-sm' : 'text-gray-500 text-sm'}>{user?.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {user?.department && (
                <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: '#2B5BA8' }}>
                  {user.department}
                </span>
              )}
              {user?.batchYear && (
                <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: '#1B3A6B' }}>
                  Batch {user.batchYear}
                </span>
              )}
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 capitalize font-medium">
                ✓ {user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings card — dark/light mode */}
      <div className={card}>
        <h3 className={heading}>Appearance</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className={value}>Theme Mode</p>
            <p className={label}>Switch between light and dark interface</p>
          </div>
          <button
            onClick={toggle}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border"
            style={
              dark
                ? { background: '#1f2937', borderColor: '#374151', color: '#f9fafb' }
                : { background: '#f9fafb', borderColor: '#e5e7eb', color: '#1f2937' }
            }
          >
            {dark ? (
              <><Sun className="w-4 h-4 text-yellow-400" /> Light Mode</>
            ) : (
              <><Moon className="w-4 h-4 text-indigo-500" /> Dark Mode</>
            )}
          </button>
        </div>
      </div>

      {/* Personal info */}
      <div className={card}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={dark ? 'text-white font-bold text-base' : 'text-gray-800 font-bold text-base'}>Personal Information</h3>
          {!editing ? (
            <button onClick={startEditing} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${dark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing(false)} className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border ${dark ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-600'}`}>
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#1B3A6B,#2B5BA8)' }}>
                <Check className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`p-3 rounded-lg ${dark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-1"><Mail className="w-4 h-4 text-gray-400" /><span className={label}>Email Address</span></div>
            <p className={value}>{user?.email}</p>
          </div>

          {user?.role === 'admin' && (
            <div className={`p-3 rounded-lg ${dark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-1"><AtSign className="w-4 h-4 text-gray-400" /><span className={label}>Username</span></div>
              {editing ? (
                <input className={inputCls} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="Username" />
              ) : (
                <p className={value}>{user?.username || '—'}</p>
              )}
            </div>
          )}

          {user?.role === 'faculty' && (
            <div className={`p-3 rounded-lg ${dark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-1"><Briefcase className="w-4 h-4 text-gray-400" /><span className={label}>Position</span></div>
              {editing ? (
                <input className={inputCls} value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} placeholder="e.g. Department Chair" />
              ) : (
                <p className={value}>{user?.position || '—'}</p>
              )}
            </div>
          )}

          <div className={`p-3 rounded-lg ${dark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-1"><Phone className="w-4 h-4 text-gray-400" /><span className={label}>Phone Number</span></div>
            {editing ? (
              <input className={inputCls} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+63 9XX XXX XXXX" />
            ) : (
              <p className={value}>{user?.phone || '—'}</p>
            )}
          </div>

          <div className={`p-3 rounded-lg ${dark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-1"><MapPin className="w-4 h-4 text-gray-400" /><span className={label}>Address</span></div>
            {editing ? (
              <input className={inputCls} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Street, City" />
            ) : (
              <p className={value}>{user?.address || '—'}</p>
            )}
          </div>

          <div className={`p-3 rounded-lg ${dark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-1"><GraduationCap className="w-4 h-4 text-gray-400" /><span className={label}>Department</span></div>
            <p className={value}>{user?.department || '—'}</p>
          </div>

          <div className={`p-3 rounded-lg ${dark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-1"><Calendar className="w-4 h-4 text-gray-400" /><span className={label}>Batch Year</span></div>
            <p className={value}>{user?.batchYear?.toString() || '—'}</p>
          </div>

          <div className={`p-3 rounded-lg ${dark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-1"><Building className="w-4 h-4 text-gray-400" /><span className={label}>Employment</span></div>
            {editing ? (
              <div className="space-y-2">
                <input className={inputCls} value={form.currentPosition} onChange={e => setForm(f => ({ ...f, currentPosition: e.target.value }))} placeholder="Position" />
                <input className={inputCls} value={form.currentCompany} onChange={e => setForm(f => ({ ...f, currentCompany: e.target.value }))} placeholder="Company" />
              </div>
            ) : (
              <p className={value}>{employment}</p>
            )}
          </div>
        </div>
      </div>

      {/* Privacy notice */}
      <div className={`${card} ${dark ? 'border-blue-800 bg-blue-900/20' : 'border-blue-200 bg-blue-50'}`}>
        <div className="flex items-start gap-3">
          <Shield className={`w-5 h-5 mt-0.5 flex-shrink-0 ${dark ? 'text-blue-400' : 'text-blue-600'}`} />
          <div>
            <p className={`text-sm font-semibold mb-1 ${dark ? 'text-blue-300' : 'text-blue-700'}`}>Privacy & Data Protection</p>
            <p className={`text-xs ${dark ? 'text-blue-400' : 'text-blue-600'}`}>
              Your personal information is protected under RA 10173 (Data Privacy Act of 2012).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
