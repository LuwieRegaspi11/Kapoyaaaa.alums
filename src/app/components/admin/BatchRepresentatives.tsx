import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { Users, Shield, CheckCircle, XCircle, Search, UserPlus } from 'lucide-react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Button, Select, MenuItem, FormControl, InputLabel, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent, Avatar } from '@mui/material';

// ================= [ADMIN: BATCHREPRESENTATIVES] =================
// Representatives are just profiles with role='representative' and
// assigned_batch_year/assigned_department/assigned_program set — there's
// no separate join table, matching how AuthContext/RepresentativeDashboard
// already model a rep's assignment directly on their profile row.

interface Representative {
  id: string;
  name: string;
  email: string;
  batchYear: number;
  department: string;
  program: string;
  assignedDate: string;
  verificationsCount: number;
  profileImage?: string;
}

export default function BatchRepresentatives() {
  const { user } = useAuth();
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedBatchYear, setSelectedBatchYear] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');

  const [assignEmail, setAssignEmail] = useState('');
  const [assignBatchYear, setAssignBatchYear] = useState('');
  const [assignDepartment, setAssignDepartment] = useState('');
  const [assignProgram, setAssignProgram] = useState('');
  const [assignError, setAssignError] = useState('');
  const [assigning, setAssigning] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, email, assigned_batch_year, assigned_department, assigned_program, assigned_at, batch_verified_by')
      .eq('role', 'representative')
      .order('assigned_at', { ascending: false });
    if (!data) return;
    // verifications count = how many alumni this rep has personally verified
    const { data: verifs } = await supabase.from('profiles').select('batch_verified_by').eq('batch_verified', true);
    const counts: Record<string, number> = {};
    (verifs || []).forEach((v: any) => { if (v.batch_verified_by) counts[v.batch_verified_by] = (counts[v.batch_verified_by] || 0) + 1; });
    setRepresentatives(data.map((r: any) => ({
      id: r.id, name: r.name, email: r.email,
      batchYear: r.assigned_batch_year, department: r.assigned_department || '', program: r.assigned_program || '',
      assignedDate: r.assigned_at || '', verificationsCount: counts[r.id] || 0,
    })));
  };

  useEffect(() => { load(); }, []);

  const filteredReps = representatives.filter(rep => {
    const matchesSearch = rep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rep.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !selectedDepartment || rep.department === selectedDepartment;
    const matchesYear = !selectedBatchYear || rep.batchYear?.toString() === selectedBatchYear;
    const matchesProgram = !selectedProgram || rep.program === selectedProgram;
    return matchesSearch && matchesDept && matchesYear && matchesProgram;
  });

  const totalVerifications = representatives.reduce((sum, r) => sum + r.verificationsCount, 0);

  const resetAssignForm = () => {
    setAssignEmail(''); setAssignBatchYear(''); setAssignDepartment(''); setAssignProgram(''); setAssignError('');
  };

  const handleAssign = async () => {
    setAssignError('');
    if (!assignEmail || !assignBatchYear || !assignDepartment || !assignProgram) {
      setAssignError('All fields are required.');
      return;
    }
    setAssigning(true);
    try {
      const { data: alumnus, error } = await supabase
        .from('profiles')
        .select('id, name, role, batch_year, department, program')
        .ilike('email', assignEmail.trim())
        .maybeSingle();

      if (error || !alumnus) {
        setAssignError('No account found with that email.');
        return;
      }
      if (alumnus.role !== 'alumni' && alumnus.role !== 'representative') {
        setAssignError('Only alumni accounts can be assigned as representatives.');
        return;
      }
      const yearNum = Number(assignBatchYear);
      if (alumnus.batch_year !== yearNum || alumnus.department !== assignDepartment || alumnus.program !== assignProgram) {
        setAssignError('This alumni’s own batch year, department, and program must match the assignment exactly.');
        return;
      }

      // Enforce one rep per (batch_year, department, program): demote any
      // existing rep for this exact combo back to alumni first.
      await supabase
        .from('profiles')
        .update({ role: 'alumni', assigned_batch_year: null, assigned_department: null, assigned_program: null, assigned_at: null })
        .eq('role', 'representative')
        .eq('assigned_batch_year', yearNum)
        .eq('assigned_department', assignDepartment)
        .eq('assigned_program', assignProgram);

      await supabase
        .from('profiles')
        .update({
          role: 'representative',
          assigned_batch_year: yearNum, assigned_department: assignDepartment, assigned_program: assignProgram,
          assigned_at: new Date().toISOString(),
        })
        .eq('id', alumnus.id);

      await supabase.rpc('log_audit', {
        p_action: `Assigned ${alumnus.name} as batch representative`,
        p_module: 'Batch Representatives',
        p_details: `Batch ${yearNum} · ${assignDepartment} · ${assignProgram}`,
        p_severity: 'Medium',
      });

      setAssignDialogOpen(false);
      resetAssignForm();
      await load();
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (rep: Representative) => {
    await supabase
      .from('profiles')
      .update({ role: 'alumni', assigned_batch_year: null, assigned_department: null, assigned_program: null, assigned_at: null })
      .eq('id', rep.id);
    await supabase.rpc('log_audit', {
      p_action: `Removed ${rep.name} as batch representative`,
      p_module: 'Batch Representatives',
      p_details: `Batch ${rep.batchYear} · ${rep.department} · ${rep.program}`,
      p_severity: 'Medium',
    });
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl mb-1 bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent flex items-center gap-2">
            👥 Batch Representatives
          </h2>
          <p className="text-gray-600">Manage batch representatives for decentralized verification</p>
        </div>
        <Button
          variant="contained"
          startIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => setAssignDialogOpen(true)}
          className="bg-gradient-to-r from-teal-600 to-green-600"
        >
          Assign Representative
        </Button>
      </div>

      {/* Info Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 shadow-lg">
        <CardContent>
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm mb-1 font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">🔒 Representative System</h4>
              <p className="text-xs text-gray-700">
                Batch Representatives can only verify alumni from their assigned <strong>batch year + department + program</strong>. Only ONE representative per batch year + department + program combination (Unique Constraint). All verification actions are audited per RA 10175.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-all border-l-4 border-teal-500 animate-slide-up">
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 font-medium">Active Representatives</span>
              <div className="bg-teal-100 p-2 rounded-lg">
                <UserPlus className="w-5 h-5 text-teal-500" />
              </div>
            </div>
            <p className="text-3xl bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent">{representatives.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-all border-l-4 border-blue-500 animate-slide-up delay-100">
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 font-medium">Total Verifications</span>
              <div className="bg-blue-100 p-2 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <p className="text-3xl bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{totalVerifications}</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-all border-l-4 border-purple-500 animate-slide-up delay-200">
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 font-medium">Covered Batches</span>
              <div className="bg-purple-100 p-2 rounded-lg">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
            </div>
            <p className="text-3xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{representatives.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <TextField
              fullWidth
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <Search className="w-4 h-4 text-gray-400 mr-2" /> }}
            />
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} label="Department">
                <MenuItem value="">All Departments</MenuItem>
                <MenuItem value="CSE">CSE</MenuItem>
                <MenuItem value="CTHM">CTHM</MenuItem>
                <MenuItem value="BAA">BAA</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Program</InputLabel>
              <Select value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)} label="Program">
                <MenuItem value="">All Programs</MenuItem>
                {['BSIT','BSCS','BSCpE','BSIS','BSHM','BSTM','BSHRM','BSA','BSBA','BSAIS','BSE'].map(p => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Batch Year</InputLabel>
              <Select value={selectedBatchYear} onChange={(e) => setSelectedBatchYear(e.target.value)} label="Batch Year">
                <MenuItem value="">All Years</MenuItem>
                {Array.from({ length: new Date().getFullYear() - 1975 + 1 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <MenuItem key={year} value={year.toString()}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </CardContent>
      </Card>

      {/* Representatives Table */}
      <TableContainer component={Paper} className="shadow-lg">
        <Table>
          <TableHead>
            <TableRow className="bg-gradient-to-r from-teal-50 to-green-50">
              <TableCell>Representative</TableCell>
              <TableCell>Assignment</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Program</TableCell>
              <TableCell>Assigned Date</TableCell>
              <TableCell>Verifications</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredReps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-gray-500">No batch representatives found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredReps.map((rep) => (
                <TableRow key={rep.id} hover>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar src={rep.profileImage} alt={rep.name} />
                      <div>
                        <p className="text-sm">{rep.name}</p>
                        <p className="text-xs text-gray-500">{rep.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip label={`Batch ${rep.batchYear}`} size="small" color="primary" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={rep.department}
                      size="small"
                      sx={{
                        backgroundColor: rep.department === 'CSE' ? '#a855f7' :
                                       rep.department === 'CTHM' ? '#ef4444' :
                                       rep.department === 'BAA' ? '#eab308' : '#6b7280',
                        color: 'white'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={rep.program} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{rep.assignedDate ? new Date(rep.assignedDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>
                    <span className="font-semibold text-teal-600">{rep.verificationsCount}</span>
                  </TableCell>
                  <TableCell>
                    <Button size="small" color="error" onClick={() => handleRemove(rep)}>Remove</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => { setAssignDialogOpen(false); resetAssignForm(); }} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Batch Representative</DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-4">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
              <p className="text-xs text-gray-700">
                ⚠️ <strong>Unique Constraint:</strong> Only ONE representative can be assigned per <strong>Batch Year + Department + Program</strong> combination. Assigning a new representative will replace any existing one for that specific combination.
              </p>
            </div>
            {assignError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">{assignError}</div>
            )}

            <TextField
              fullWidth
              label="Alumni Email"
              placeholder="Enter alumni email to assign as representative"
              helperText="The alumni must be from the exact batch year, department, and program they will represent"
              value={assignEmail}
              onChange={(e) => setAssignEmail(e.target.value)}
            />

            <FormControl fullWidth>
              <InputLabel>Batch Year to Represent</InputLabel>
              <Select value={assignBatchYear} onChange={(e) => setAssignBatchYear(e.target.value)} label="Batch Year to Represent">
                {Array.from({ length: new Date().getFullYear() - 1975 + 1 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <MenuItem key={year} value={year.toString()}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select value={assignDepartment} onChange={(e) => setAssignDepartment(e.target.value)} label="Department">
                <MenuItem value="CSE">CSE - Computer Science & Engineering</MenuItem>
                <MenuItem value="CTHM">CTHM - Tourism & Hospitality</MenuItem>
                <MenuItem value="BAA">BAA - Business & Accountancy</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Program/Course</InputLabel>
              <Select value={assignProgram} onChange={(e) => setAssignProgram(e.target.value)} label="Program/Course">
                <MenuItem value="BSIT">BSIT - Information Technology</MenuItem>
                <MenuItem value="BSCS">BSCS - Computer Science</MenuItem>
                <MenuItem value="BSCpE">BSCpE - Computer Engineering</MenuItem>
                <MenuItem value="BSIS">BSIS - Information Systems</MenuItem>
                <MenuItem value="BSHM">BSHM - Hospitality Management</MenuItem>
                <MenuItem value="BSTM">BSTM - Tourism Management</MenuItem>
                <MenuItem value="BSHRM">BSHRM - Hotel & Restaurant Management</MenuItem>
                <MenuItem value="BSA">BSA - Accountancy</MenuItem>
                <MenuItem value="BSBA">BSBA - Business Administration</MenuItem>
                <MenuItem value="BSAIS">BSAIS - Accounting Information System</MenuItem>
                <MenuItem value="BSE">BSE - Entrepreneurship</MenuItem>
              </Select>
            </FormControl>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setAssignDialogOpen(false); resetAssignForm(); }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAssign}
            disabled={assigning}
            className="bg-gradient-to-r from-teal-600 to-green-600"
          >
            Assign Representative
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
