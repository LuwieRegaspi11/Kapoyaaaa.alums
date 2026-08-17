import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { FileText, Search, Eye, Send, BarChart3, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { Card, CardContent, TextField, Button, Chip, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, ToggleButton, ToggleButtonGroup, Alert } from '@mui/material';

// ================= [ADMIN: TRACERSURVEYS] =================
// Backed by Supabase (tracer_surveys / tracer_survey_responses tables).
// A survey is either 'standard' (the built-in question set below,
// answered in-app) or 'external' (a link to an outside form, e.g.
// Google Forms — alumni just get sent there in a new tab). Response
// counts are inherently untrackable for external surveys, so they're
// excluded from response-rate stats instead of being force-fit into them.

interface Survey {
  id: string; title: string; description: string; targetDept: string; targetYear: string;
  totalSent: number; totalResponses: number; status: 'Draft' | 'Active' | 'Closed'; createdDate: string;
  surveyType: 'standard' | 'external'; surveyLink: string | null;
}

const isValidUrl = (value: string) => {
  try {
    const u = new URL(value.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

const TEMPLATE_QUESTIONS = [
  { id: 'q2', section: 'Employment Details', question: 'How long did it take you to find your first job after graduation?', type: 'radio', options: ['Less than 1 month', '1-3 months', '4-6 months', '7-12 months', 'More than 1 year', 'Not applicable'] },
  { id: 'q3', section: 'Employment Details', question: 'Is your current job related to your course/program?', type: 'radio', options: ['Very related', 'Somewhat related', 'Not related', 'Not applicable'] },
  { id: 'q4', section: 'Employment Details', question: 'What industry are you currently working in?', type: 'radio', options: ['Information Technology', 'Business / Finance', 'Tourism / Hospitality', 'Education', 'Healthcare', 'Government', 'Other'] },
  { id: 'q5', section: 'Employment Details', question: 'What is your current job title / position?', type: 'text', placeholder: 'e.g. Software Engineer, Front Desk Officer' },
  { id: 'q6', section: 'Employment Details', question: 'What is your employer name and location?', type: 'text', placeholder: 'e.g. TechCorp, Cebu City' },
  { id: 'q7', section: 'Further Studies', question: 'Are you currently pursuing or planning to pursue further studies?', type: 'radio', options: ['Yes, currently enrolled', 'Yes, planning to enroll', 'No'] },
  { id: 'q8', section: 'Feedback', question: 'How would you rate the quality of education you received from Asian College?', type: 'radio', options: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'] },
  { id: 'q9', section: 'Feedback', question: 'Which skills from your program have been most useful in your career?', type: 'textarea', placeholder: 'Share the skills, subjects, or experiences that helped you most...' },
  { id: 'q10', section: 'Feedback', question: 'Do you have any suggestions to improve the curriculum or alumni services?', type: 'textarea', placeholder: 'Your honest feedback helps us improve...' },
];

export default function TracerSurveys() {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDept, setNewDept] = useState('All');
  const [newYear, setNewYear] = useState('All');
  const [newSurveyType, setNewSurveyType] = useState<'standard' | 'external'>('standard');
  const [newSurveyLink, setNewSurveyLink] = useState('');
  const [viewSurvey, setViewSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<any[]>([]);

  const load = async () => {
    const { data } = await supabase.from('tracer_surveys').select('*').order('created_at', { ascending: false });
    if (!data) return;

    const { data: alumniRows } = await supabase.from('profiles').select('department').eq('role', 'alumni');
    const deptCounts: Record<string, number> = {};
    (alumniRows || []).forEach((a: any) => { deptCounts[a.department] = (deptCounts[a.department] || 0) + 1; });
    const totalAlumni = (alumniRows || []).length;

    const { data: responseRows } = await supabase.from('tracer_survey_responses').select('survey_id');
    const responseCounts: Record<string, number> = {};
    (responseRows || []).forEach((r: any) => { responseCounts[r.survey_id] = (responseCounts[r.survey_id] || 0) + 1; });

    setSurveys(data.map((s: any) => ({
      id: s.id, title: s.title, description: s.description || '',
      targetDept: s.target_dept, targetYear: s.target_year, status: s.status,
      createdDate: s.created_at,
      totalSent: s.target_dept === 'All' ? totalAlumni : (deptCounts[s.target_dept] || 0),
      totalResponses: responseCounts[s.id] || 0,
      surveyType: s.survey_type === 'external' ? 'external' : 'standard',
      surveyLink: s.survey_link || null,
    })));
  };

  useEffect(() => { load(); }, []);

  const filteredSurveys = surveys.filter(survey =>
    survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    survey.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    survey.targetDept.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const createSurvey = async (
    status: 'Draft' | 'Active', title: string, description: string, targetDept: string, targetYear: string,
    surveyType: 'standard' | 'external' = 'standard', surveyLink: string = ''
  ) => {
    if (!user) return;
    await supabase.from('tracer_surveys').insert({
      title, description, target_dept: targetDept, target_year: targetYear, status,
      questions: surveyType === 'standard' ? TEMPLATE_QUESTIONS : [],
      survey_type: surveyType,
      survey_link: surveyType === 'external' ? surveyLink.trim() : null,
      created_by: user.id,
    });
    await supabase.rpc('log_audit', {
      p_action: status === 'Active' ? `Deployed survey: ${title}` : `Created survey: ${title}`,
      p_module: 'Tracer Surveys', p_details: `Target: ${targetDept} · ${targetYear}`, p_severity: 'Low',
    });
    await load();
  };

  const handleCreate = async () => {
    if (!newTitle) return;
    if (newSurveyType === 'external' && !isValidUrl(newSurveyLink)) return;
    await createSurvey('Draft', newTitle, newDescription, newDept, newYear, newSurveyType, newSurveyLink);
    setCreateOpen(false);
    setNewTitle(''); setNewDescription(''); setNewDept('All'); setNewYear('All');
    setNewSurveyType('standard'); setNewSurveyLink('');
  };

  const handleDeployTemplate = () => createSurvey('Active', 'Employment Tracer Survey', 'Standard employment tracer questions deployed to all alumni.', 'All', 'All');

  const handleClose = async (survey: Survey) => {
    await supabase.from('tracer_surveys').update({ status: 'Closed' }).eq('id', survey.id);
    await supabase.rpc('log_audit', { p_action: `Closed survey: ${survey.title}`, p_module: 'Tracer Surveys', p_details: null, p_severity: 'Low' });
    await load();
  };

  const openView = async (survey: Survey) => {
    setViewSurvey(survey);
    if (survey.surveyType === 'external') { setResponses([]); return; } // untrackable — nothing to fetch
    const { data } = await supabase
      .from('tracer_survey_responses')
      .select('id, submitted_at, respondent:profiles(name, department, program)')
      .eq('survey_id', survey.id)
      .order('submitted_at', { ascending: false });
    setResponses(data || []);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl mb-1">Tracer Surveys</h2>
          <p className="text-gray-600">Deploy and monitor alumni tracer surveys</p>
        </div>
        <Button variant="contained" startIcon={<FileText className="w-4 h-4" />} className="bg-blue-600" onClick={() => setCreateOpen(true)}>
          Create New Survey
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search surveys by title, description, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <Search className="w-4 h-4 text-gray-400 mr-2" /> }}
          />
        </CardContent>
      </Card>

      {/* Survey Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Surveys</span>
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl">{surveys.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Active Surveys</span>
              <Send className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl">{surveys.filter(s => s.status === 'Active').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Avg Response Rate</span>
              <BarChart3 className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl">
              {(() => {
                const trackable = surveys.filter(s => s.surveyType !== 'external');
                if (trackable.length === 0) return '0%';
                return `${(trackable.reduce((sum, s) => sum + (s.totalSent ? s.totalResponses / s.totalSent : 0), 0) / trackable.length * 100).toFixed(1)}%`;
              })()}
            </p>
            <p className="text-xs text-gray-400 mt-1">Excludes external-link surveys (untrackable)</p>
          </CardContent>
        </Card>
      </div>

      {/* Survey List */}
      <div className="space-y-4">
        {filteredSurveys.length === 0 ? (
          <Card><CardContent className="text-center py-8"><p className="text-gray-500">No surveys found matching your search</p></CardContent></Card>
        ) : (
          filteredSurveys.map((survey) => {
            const responseRate = survey.totalSent ? (survey.totalResponses / survey.totalSent) * 100 : 0;
            return (
              <Card key={survey.id}>
                <CardContent>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg">{survey.title}</h3>
                        <Chip label={survey.status} size="small" color={survey.status === 'Active' ? 'success' : survey.status === 'Draft' ? 'default' : 'error'} />
                        {survey.surveyType === 'external' && (
                          <Chip icon={<LinkIcon className="w-3.5 h-3.5" />} label="External Link" size="small" variant="outlined" color="info" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{survey.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Target: {survey.targetDept} • {survey.targetYear}</span>
                        <span>Created: {new Date(survey.createdDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outlined" size="small" startIcon={<Eye className="w-4 h-4" />} onClick={() => openView(survey)}>View</Button>
                      {survey.status !== 'Closed' && (
                        <Button variant="outlined" size="small" color="error" onClick={() => handleClose(survey)}>Close</Button>
                      )}
                    </div>
                  </div>
                  {survey.surveyType === 'external' ? (
                    <div className="flex items-center justify-between text-sm bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                      <span className="text-blue-700 flex items-center gap-1.5"><LinkIcon className="w-3.5 h-3.5" /> External link — response rate isn't tracked</span>
                      <a href={survey.surveyLink || '#'} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold flex items-center gap-1 hover:underline">
                        Open Link <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Response Rate</span>
                        <span>{survey.totalResponses} / {survey.totalSent} ({responseRate.toFixed(1)}%)</span>
                      </div>
                      <LinearProgress variant="determinate" value={responseRate} className="h-2 rounded" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Survey Template Preview */}
      <Card>
        <CardContent>
          <h3 className="text-lg mb-4">Quick Deploy Template</h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <p className="text-sm">Standard Employment Tracer Questions:</p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Company name and position</li>
              <li>• Job alignment with degree program</li>
              <li>• Monthly income range</li>
              <li>• Skills utilized in current work</li>
              <li>• Recommendations for curriculum improvement</li>
            </ul>
            <Button variant="contained" size="small" className="bg-blue-600" onClick={handleDeployTemplate}>
              Deploy to All Alumni
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Survey</DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-2">
            <TextField fullWidth label="Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            <TextField fullWidth label="Description" multiline rows={2} value={newDescription} onChange={e => setNewDescription(e.target.value)} />

            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1.5">Survey Type</p>
              <ToggleButtonGroup
                fullWidth
                exclusive
                size="small"
                value={newSurveyType}
                onChange={(_e, val) => { if (val) setNewSurveyType(val); }}
              >
                <ToggleButton value="standard">Standard Question Set</ToggleButton>
                <ToggleButton value="external">External Survey Link</ToggleButton>
              </ToggleButtonGroup>
            </div>

            {newSurveyType === 'standard' ? (
              <p className="text-xs text-gray-500">Uses the standard employment tracer question set below. The survey is created as a Draft — deploy it by editing its status.</p>
            ) : (
              <>
                <TextField
                  fullWidth
                  label="Survey URL"
                  placeholder="https://forms.google.com/..."
                  value={newSurveyLink}
                  onChange={e => setNewSurveyLink(e.target.value)}
                  error={newSurveyLink.trim().length > 0 && !isValidUrl(newSurveyLink)}
                  helperText={
                    newSurveyLink.trim().length > 0 && !isValidUrl(newSurveyLink)
                      ? 'Enter a valid http(s) URL.'
                      : 'Alumni will open this link in a new tab instead of the built-in form.'
                  }
                />
                <Alert severity="info" className="text-xs">
                  Response counts can't be tracked automatically for external surveys — they're excluded from response-rate stats.
                </Alert>
              </>
            )}

            <FormControl fullWidth>
              <InputLabel>Target Department</InputLabel>
              <Select value={newDept} onChange={e => setNewDept(e.target.value)} label="Target Department">
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="CSE">CSE</MenuItem>
                <MenuItem value="CTHM">CTHM</MenuItem>
                <MenuItem value="BAA">BAA</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth label="Target Year Range" placeholder="e.g. All, or 2020-2023" value={newYear} onChange={e => setNewYear(e.target.value)} />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            className="bg-blue-600"
            disabled={!newTitle || (newSurveyType === 'external' && !isValidUrl(newSurveyLink))}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Responses Dialog */}
      <Dialog open={!!viewSurvey} onClose={() => setViewSurvey(null)} maxWidth="md" fullWidth>
        <DialogTitle>{viewSurvey?.title} — Responses</DialogTitle>
        <DialogContent>
          {viewSurvey?.surveyType === 'external' ? (
            <div className="text-sm text-gray-500 py-6 text-center space-y-2">
              <p>Responses aren't tracked for external surveys — they're collected on the outside form itself.</p>
              {viewSurvey.surveyLink && (
                <a href={viewSurvey.surveyLink} target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1">
                  Open survey link <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ) : responses.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">No responses yet.</p>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Alumni</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Program</TableCell>
                    <TableCell>Submitted</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {responses.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.respondent?.name || 'Unknown'}</TableCell>
                      <TableCell>{r.respondent?.department || '—'}</TableCell>
                      <TableCell>{r.respondent?.program || '—'}</TableCell>
                      <TableCell>{new Date(r.submitted_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewSurvey(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
