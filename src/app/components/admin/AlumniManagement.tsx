import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Edit, CheckCircle, Archive, X } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { isValidStudentId, STUDENT_ID_PLACEHOLDER, STUDENT_ID_HINT } from '../../../lib/validators';

// ================= [ADMIN: ALUMNI MANAGEMENT — connected to Supabase] =================

const DEPARTMENTS = ['All', 'CSE', 'CTHM', 'BAA'];
const PROGRAMS = ['All', 'BSIT', 'BSCS', 'BSHM', 'BSBA'];

interface AlumniRow {
  id: string;
  studentId: string;
  name: string;
  email: string;
  department: string;
  program: string;
  batchYear: number;
  verified: boolean;
  active: boolean;
}

function mapRow(p: any): AlumniRow {
  return {
    id: p.id,
    studentId: p.student_id || '\u2014',
    name: p.name,
    email: p.email,
    department: p.department || '\u2014',
    program: p.program || '\u2014',
    batchYear: p.batch_year || 0,
    verified: !!p.batch_verified,
    active: p.active !== false,
  };
}

export default function AlumniManagement() {
  const [alumni, setAlumni] = useState<AlumniRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterProgram, setFilterProgram] = useState('All');
  const [filterYear, setFilterYear] = useState('All');
  const [editTarget, setEditTarget] = useState<AlumniRow | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const loadAlumni = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'alumni')
      .order('created_at', { ascending: false });
    setAlumni((data || []).map(mapRow));
    setLoading(false);
  };

  useEffect(() => { loadAlumni(); }, []);

  const filtered = alumni.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.name.toLowerCase().includes(q) || a.studentId.toLowerCase().includes(q) || a.email.includes(q);
    const matchDept = filterDept === 'All' || a.department === filterDept;
    const matchProgram = filterProgram === 'All' || a.program === filterProgram;
    const matchYear = filterYear === 'All' || a.batchYear.toString() === filterYear;
    return matchSearch && matchDept && matchProgram && matchYear;
  });

  const verifyAlumni = async (id: string) => {
    await supabase.from('profiles').update({ batch_verified: true }).eq('id', id);
    loadAlumni();
  };

  const toggleArchive = async (id: string, currentlyActive: boolean) => {
    await supabase.from('profiles').update({ active: !currentlyActive }).eq('id', id);
    loadAlumni();
  };

  const [editForm, setEditForm] = useState({ name: '', email: '', studentId: '', program: '', department: '', batchYear: '' });
  const [editError, setEditError] = useState('');

  const openEdit = (a: AlumniRow) => {
    setEditTarget(a);
    setEditError('');
    setEditForm({ name: a.name, email: a.email, studentId: a.studentId === '\u2014' ? '' : a.studentId, program: a.program, department: a.department, batchYear: String(a.batchYear) });
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    if (editForm.studentId && !isValidStudentId(editForm.studentId)) {
      setEditError(`Student ID must be in the format YYYY-NNNNNNN (${STUDENT_ID_PLACEHOLDER}).`);
      return;
    }
    setEditError('');
    await supabase.from('profiles').update({
      name: editForm.name,
      student_id: editForm.studentId || null,
      program: editForm.program,
      department: editForm.department,
      batch_year: parseInt(editForm.batchYear) || null,
    }).eq('id', editTarget.id);
    setEditTarget(null);
    loadAlumni();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Alumni Management</h2>
          <p className="text-sm text-gray-500">Manage all registered alumni records</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Export PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, alumni ID, or email..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400" />
          </div>
          <button onClick={() => setShowFilters(f => !f)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Department', value: filterDept, set: setFilterDept, opts: DEPARTMENTS },
              { label: 'Program', value: filterProgram, set: setFilterProgram, opts: PROGRAMS },
              { label: 'Batch Year', value: filterYear, set: setFilterYear, opts: ['All', '2018','2019','2020','2021','2022','2023','2024','2025','2026'] },
            ].map(f => (
              <div key={f.label}>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">{f.label}</label>
                <select value={f.value} onChange={e => f.set(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
                  {f.opts.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-600">
            {loading ? 'Loading\u2026' : `${filtered.length} alumni found`}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Alumni ID','Name','Dept','Program','Batch','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                  No alumni registered yet.
                </td></tr>
              )}
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{a.studentId}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-800">{a.name}</div>
                    <div className="text-xs text-gray-400">{a.email}</div>
                  </td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">{a.department}</span></td>
                  <td className="px-4 py-3 text-gray-600">{a.program}</td>
                  <td className="px-4 py-3 text-gray-600">{a.batchYear || '\u2014'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${a.verified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {a.verified ? '\u2713 Verified' : '\u23f3 Unverified'}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${a.active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                        {a.active ? 'Active' : 'Archived'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(a)} title="Edit"
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                      {!a.verified && (
                        <button onClick={() => verifyAlumni(a.id)} title="Verify" className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"><CheckCircle className="w-3.5 h-3.5" /></button>
                      )}
                      <button onClick={() => toggleArchive(a.id, a.active)} title={a.active ? 'Archive' : 'Unarchive'} className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-600 transition-colors"><Archive className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-gray-800">Edit Alumni Profile</h3>
              <button onClick={() => setEditTarget(null)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Full Name</label>
                <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Alumni ID</label>
                <input value={editForm.studentId} onChange={e => setEditForm(f => ({ ...f, studentId: e.target.value }))}
                  placeholder={STUDENT_ID_PLACEHOLDER}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400" />
                <p className="text-xs text-gray-400 mt-1">{STUDENT_ID_HINT}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Program</label>
                <input value={editForm.program} onChange={e => setEditForm(f => ({ ...f, program: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Department</label>
                <input value={editForm.department} onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Batch Year</label>
                <input value={editForm.batchYear} onChange={e => setEditForm(f => ({ ...f, batchYear: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400" />
              </div>
            </div>
            {editError && <p className="text-xs text-red-500 px-6 -mt-2 pb-2">{editError}</p>}
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setEditTarget(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={saveEdit} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#1B3A6B,#2B5BA8)' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
