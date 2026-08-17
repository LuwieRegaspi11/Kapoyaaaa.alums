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

// ================= [ADMIN: DONATIONMONITORING] =================

interface Donation {
  id: string;
  donorName: string;
  amount: number;
  type: 'Cash' | 'In-Kind';
  method: 'Bank Transfer' | 'In-Person' | 'In-Kind';
  status: 'Pending' | 'Verified' | 'Rejected';
  project?: string;
  proofUrl?: string;
  description?: string;
  submittedDate: string;
}

const mockDonations: Donation[] = [];

const projects = [
  { name: 'Lab Upgrade 2024', target: 500000, current: 325000 },
  { name: 'Scholarship Fund', target: 200000, current: 145000 },
  { name: 'Library Books', target: 100000, current: 78000 },
  { name: 'Sports Equipment', target: 150000, current: 52000 }
];

export default function DonationMonitoring() {
  const [donations] = useState<Donation[]>(mockDonations);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterProject, setFilterProject] = useState('All');

  const filteredDonations = donations.filter(donation => {
    const matchesSearch = donation.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donation.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donation.amount.toString().includes(searchTerm);
    const matchesStatus = filterStatus === 'All' || donation.status === filterStatus;
    const matchesProject = filterProject === 'All' || donation.project === filterProject;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const totalDonations = donations.filter(d => d.status === 'Verified').reduce((sum, d) => sum + d.amount, 0);
  const pendingDonations = donations.filter(d => d.status === 'Pending').length;
  const verifiedDonations = donations.filter(d => d.status === 'Verified').length;

  const handleView = (donation: Donation) => {
    setSelectedDonation(donation);
    setViewDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl mb-1">Donation Monitoring</h2>
          <p className="text-gray-600">Real-time tracking and verification of donations</p>
        </div>
        <Button
          variant="outlined"
          startIcon={<Download className="w-4 h-4" />}
        >
          Generate Report
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Donations</span>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl">₱{totalDonations.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Pending Review</span>
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl">{pendingDonations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Verified</span>
              <CheckCircle className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl">{verifiedDonations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Active Donors</span>
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl">89</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <TextField
              fullWidth
              placeholder="Search by donor, project, or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search className="w-4 h-4 text-gray-400 mr-2" />
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} label="Status">
                <MenuItem value="All">All Status</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Verified">Verified</MenuItem>
                <MenuItem value="Rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Project</InputLabel>
              <Select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} label="Project">
                <MenuItem value="All">All Projects</MenuItem>
                {projects.map((project, index) => (
                  <MenuItem key={index} value={project.name}>{project.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="outlined" fullWidth onClick={() => {
              setSearchTerm('');
              setFilterStatus('All');
              setFilterProject('All');
            }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Project Funding Progress */}
      <Card>
        <CardContent>
          <h3 className="text-lg mb-4">Project Funding Progress</h3>
          <div className="space-y-4">
            {projects.map((project, index) => {
              const percentage = (project.current / project.target) * 100;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">{project.name}</span>
                    <span className="text-sm text-gray-600">
                      ₱{project.current.toLocaleString()} / ₱{project.target.toLocaleString()} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(percentage, 100)}
                    className="h-3 rounded"
                    color={percentage >= 100 ? 'success' : 'primary'}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Donation Transactions */}
      <Card>
        <CardContent>
          <h3 className="text-lg mb-4">Recent Transactions</h3>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell>Donor</TableCell>
                  <TableCell>Amount / Type</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDonations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-gray-500">No donations found matching your search criteria</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDonations.map((donation) => (
                  <TableRow key={donation.id} hover>
                    <TableCell>{donation.donorName}</TableCell>
                    <TableCell>
                      {donation.type === 'Cash'
                        ? `₱${donation.amount.toLocaleString()}`
                        : <Chip label="In-Kind" size="small" color="info" />
                      }
                    </TableCell>
                    <TableCell>{donation.method}</TableCell>
                    <TableCell>{donation.project || '-'}</TableCell>
                    <TableCell>{new Date(donation.submittedDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={donation.status}
                        size="small"
                        color={
                          donation.status === 'Verified' ? 'success' :
                          donation.status === 'Pending' ? 'warning' : 'error'
                        }
                        icon={
                          donation.status === 'Verified' ? <CheckCircle className="w-3 h-3" /> :
                          donation.status === 'Pending' ? <Clock className="w-3 h-3" /> :
                          <XCircle className="w-3 h-3" />
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => handleView(donation)}
                        startIcon={<Eye className="w-3 h-3" />}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Donation Verification</DialogTitle>
        <DialogContent>
          {selectedDonation && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Donor Name</p>
                  <p>{selectedDonation.donorName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p>
                    {selectedDonation.type === 'Cash'
                      ? `₱${selectedDonation.amount.toLocaleString()}`
                      : 'In-Kind Donation'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Method</p>
                  <p>{selectedDonation.method}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Project</p>
                  <p>{selectedDonation.project || 'General Fund'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Submitted Date</p>
                  <p>{new Date(selectedDonation.submittedDate).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Chip
                    label={selectedDonation.status}
                    size="small"
                    color={
                      selectedDonation.status === 'Verified' ? 'success' :
                      selectedDonation.status === 'Pending' ? 'warning' : 'error'
                    }
                  />
                </div>
              </div>

              {selectedDonation.description && (
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p>{selectedDonation.description}</p>
                </div>
              )}

              {selectedDonation.proofUrl && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Payment Proof</p>
                  <div className="bg-gray-100 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-500">[Bank transfer screenshot would be displayed here]</p>
                    <p className="text-xs text-gray-400 mt-2">{selectedDonation.proofUrl}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          {selectedDonation?.status === 'Pending' && (
            <>
              <Button color="error" startIcon={<XCircle className="w-4 h-4" />}>
                Reject
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircle className="w-4 h-4" />}
              >
                Verify & Approve
              </Button>
            </>
          )}
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
