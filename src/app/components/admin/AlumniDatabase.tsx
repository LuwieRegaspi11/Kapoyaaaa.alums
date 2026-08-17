import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../AuthContext';
import { Users, TrendingUp, DollarSign, FileText, Calendar, LogOut, BarChart3, Shield, Bell, UserCheck, UserCog, ChevronRight, Menu, X, Megaphone, Building2, Settings, BookOpen, Sun, Moon, User, Search, Download, UserPlus, Eye, Edit, Trash2, FileSpreadsheet, Archive, CheckCircle, Filter, Plus, Pin, XCircle, Power, Clock, MapPin, Upload, GraduationCap, Globe, CreditCard, Mail, Save, Phone, AtSign, Link, Palette, Send, RefreshCw } from 'lucide-react';
import { useDarkMode } from '../shared/DarkModeContext';
import { useNotifications } from '../shared/NotificationContext';
import NotificationPanel from '../shared/NotificationPanel';
import JobBoard from '../shared/JobBoard';
import ProfilePage from '../shared/ProfilePage';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Button, Select, MenuItem, FormControl, InputLabel, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent, Avatar, LinearProgress, Tabs, Tab, Box } from '@mui/material';
import { useDonations } from '../shared/DonationContext';
import EventCalendar from '../shared/EventCalendar';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

// ================= [ADMIN: ALUMNIDATABASE] =================

interface Alumni {
  id: string;
  name: string;
  email: string;
  department: string;
  program: string;
  batchYear: number;
  currentCompany?: string;
  position?: string;
  verified: boolean;
}

const mockAlumniDatabase: Alumni[] = [];

export default function AlumniDatabase() {
  const [alumni] = useState<Alumni[]>(mockAlumniDatabase);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterProgram, setFilterProgram] = useState('All');
  const [filterYear, setFilterYear] = useState('All');
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const filteredAlumni = alumni.filter(alum => {
    const matchesSearch = alum.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alum.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === 'All' || alum.department === filterDept;
    const matchesYear = filterYear === 'All' || alum.batchYear.toString() === filterYear;
    const matchesProgram = filterProgram === 'All' || alum.program === filterProgram;
    return matchesSearch && matchesDept && matchesYear && matchesProgram;
  });

  const handleView = (alum: Alumni) => {
    setSelectedAlumni(alum);
    setViewDialogOpen(true);
  };

  const convertToCSV = (data: Alumni[]) => {
    const headers = ['Name', 'Email', 'Department', 'Program', 'Batch Year', 'Company', 'Position', 'Verified'];
    const rows = data.map(a => [
      a.name,
      a.email,
      a.department,
      a.program,
      a.batchYear,
      a.currentCompany || 'N/A',
      a.position || 'N/A',
      a.verified ? 'Yes' : 'No'
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const csvContent = convertToCSV(filteredAlumni);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(csvContent, `alumni-database-${timestamp}.csv`, 'text/csv');
  };

  const handleExportPDF = () => {
    // Placeholder for PDF export
    // In a real implementation, you would use a library like jsPDF or pdfmake
    alert('PDF export functionality would be implemented here using a PDF library like jsPDF or pdfmake');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl mb-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            📚 Alumni Database
          </h2>
          <p className="text-gray-600">Centralized control over alumni records - {filteredAlumni.length} records found</p>
        </div>
        <Button
          variant="contained"
          startIcon={<UserPlus className="w-4 h-4" />}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          Add Alumni
        </Button>
      </div>

      {/* Export Section */}
      <Card className="shadow-lg border-l-4 border-green-500">
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
                <Download className="w-4 h-4 text-green-600" />
                Export Database
              </h3>
              <p className="text-xs text-gray-600">
                Export {filteredAlumni.length} filtered alumni records
                {filterDept !== 'All' && ` (${filterDept})`}
                {filterProgram !== 'All' && ` (${filterProgram})`}
                {filterYear !== 'All' && ` (Batch ${filterYear})`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outlined"
                startIcon={<FileSpreadsheet className="w-4 h-4" />}
                onClick={handleExportExcel}
                color="success"
              >
                Export Excel/CSV
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileText className="w-4 h-4" />}
                onClick={handleExportPDF}
                color="error"
              >
                Export PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <TextField
              fullWidth
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search className="w-4 h-4 text-gray-400 mr-2" />
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} label="Department">
                <MenuItem key="all-dept" value="All">All Departments</MenuItem>
                <MenuItem key="CSE" value="CSE">CSE</MenuItem>
                <MenuItem key="CTHM" value="CTHM">CTHM</MenuItem>
                <MenuItem key="BAA" value="BAA">BAA</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Program</InputLabel>
              <Select value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)} label="Program">
                <MenuItem key="all-program" value="All">All Programs</MenuItem>
                <MenuItem key="BSIT" value="BSIT">BSIT</MenuItem>
                <MenuItem key="BSCS" value="BSCS">BSCS</MenuItem>
                <MenuItem key="BSHM" value="BSHM">BSHM</MenuItem>
                <MenuItem key="BSTM" value="BSTM">BSTM</MenuItem>
                <MenuItem key="BSA" value="BSA">BSA</MenuItem>
                <MenuItem key="BSBA" value="BSBA">BSBA</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Batch Year</InputLabel>
              <Select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} label="Batch Year">
                <MenuItem key="all-year" value="All">All Years</MenuItem>
                <MenuItem key="2018" value="2018">2018</MenuItem>
                <MenuItem key="2019" value="2019">2019</MenuItem>
                <MenuItem key="2020" value="2020">2020</MenuItem>
                <MenuItem key="2021" value="2021">2021</MenuItem>
              </Select>
            </FormControl>
          </div>
        </CardContent>
      </Card>

      {/* Alumni Table */}
      <TableContainer component={Paper} className="shadow-sm">
        <Table>
          <TableHead>
            <TableRow className="bg-gradient-to-r from-blue-50 to-purple-50">
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Program</TableCell>
              <TableCell>Batch Year</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAlumni.map((alum) => (
              <TableRow key={alum.id} hover>
                <TableCell>{alum.name}</TableCell>
                <TableCell>{alum.email}</TableCell>
                <TableCell>
                  <Chip
                    label={alum.department}
                    size="small"
                    sx={{
                      backgroundColor: alum.department === 'CSE' ? '#a855f7' :
                                     alum.department === 'CTHM' ? '#ef4444' :
                                     alum.department === 'BAA' ? '#eab308' : '#6b7280',
                      color: 'white'
                    }}
                  />
                </TableCell>
                <TableCell><Chip label={alum.program} size="small" variant="outlined" /></TableCell>
                <TableCell>{alum.batchYear}</TableCell>
                <TableCell>
                  <Chip
                    label={alum.verified ? 'Verified' : 'Pending'}
                    size="small"
                    color={alum.verified ? 'success' : 'warning'}
                    variant={alum.verified ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleView(alum)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Eye className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Edit className="w-4 h-4 text-blue-600" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Alumni Details</DialogTitle>
        <DialogContent>
          {selectedAlumni && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p>{selectedAlumni.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p>{selectedAlumni.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p>{selectedAlumni.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Batch Year</p>
                  <p>{selectedAlumni.batchYear}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Verification Status</p>
                  <Chip
                    label={selectedAlumni.verified ? 'Verified' : 'Pending'}
                    size="small"
                    color={selectedAlumni.verified ? 'success' : 'warning'}
                  />
                </div>
                {selectedAlumni.currentCompany && (
                  <div>
                    <p className="text-sm text-gray-600">Current Company</p>
                    <p>{selectedAlumni.currentCompany}</p>
                  </div>
                )}
                {selectedAlumni.position && (
                  <div>
                    <p className="text-sm text-gray-600">Position</p>
                    <p>{selectedAlumni.position}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
