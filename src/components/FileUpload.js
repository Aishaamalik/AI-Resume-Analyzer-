import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, TextField, InputLabel, CircularProgress, MenuItem, Select, FormControl, InputLabel as MuiInputLabel, Card, CardContent, CardHeader, Divider, Grid, Paper, Avatar, Stepper, Step, StepLabel } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DescriptionIcon from '@mui/icons-material/Description';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNotification } from './NotificationProvider';
import { useResumeAnalysis } from './ResumeAnalysisProvider';

const BACKEND_URL = 'http://127.0.0.1:8000';

const steps = ['Upload Resume', 'Select Category', 'Upload/Paste JD', 'Analyze'];

const FileUpload = ({ onResumeUpload, onJDUpload }) => {
  const { resumeFile, setResumeFile, resumePreview, setResumePreview, selectedCategory, setSelectedCategory, analysisResult, setAnalysisResult } = useResumeAnalysis();
  const [jdFile, setJDFile] = useState(null);
  const [jdText, setJDText] = useState('');
  const [jdPreview, setJDPreview] = useState('');
  const [resumeError, setResumeError] = useState('');
  const [jdError, setJDError] = useState('');
  const [loadingResume, setLoadingResume] = useState(false);
  const [loadingJD, setLoadingJD] = useState(false);
  const [categories, setCategories] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const { addNotification } = useNotification();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Fetch categories from backend model (simulate by hardcoding for now)
  useEffect(() => {
    // Ideally, fetch from backend, but for now, hardcode
    setCategories([
      'Data Science', 'HR', 'Advocate', 'Arts', 'Web Designing', 'Mechanical Engineer',
      'Sales', 'Health and fitness', 'Civil Engineer', 'Java Developer', 'Business Analyst',
      'SAP Developer', 'Automation Testing', 'Electrical Engineering', 'Operations Manager',
      'Python Developer', 'DevOps Engineer', 'Network Security Engineer', 'PMO', 'Database',
      'Hadoop', 'ETL Developer', 'DotNet Developer', 'Blockchain', 'Testing'
    ]);
  }, []);

  const handleResumeChange = async (e) => {
    const file = e.target.files[0];
    setResumeFile(file);
    setResumePreview('');
    setResumeError('');
    setAnalysisResult(null);
    if (!file) return;
    setLoadingResume(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${BACKEND_URL}/upload_resume/`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setResumePreview(data.text);
        addNotification('success', 'Resume uploaded and text extracted successfully.');
      } else {
        setResumeError(data.error || 'Error uploading resume');
        addNotification('error', data.error || 'Error uploading resume');
      }
    } catch (err) {
      setResumeError('Network error');
      addNotification('error', 'Network error while uploading resume');
    }
    setLoadingResume(false);
  };

  const handleJDFileChange = async (e) => {
    const file = e.target.files[0];
    setJDFile(file);
    setJDPreview('');
    setJDError('');
    if (!file) return;
    setLoadingJD(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${BACKEND_URL}/upload_jd/`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setJDPreview(data.text);
        addNotification('success', 'Job description uploaded and text extracted successfully.');
      } else {
        setJDError(data.error || 'Error uploading JD');
        addNotification('error', data.error || 'Error uploading JD');
      }
    } catch (err) {
      setJDError('Network error');
      addNotification('error', 'Network error while uploading JD');
    }
    setLoadingJD(false);
  };

  const handleJDTextChange = (e) => {
    setJDText(e.target.value);
  };

  const handleJDTextSubmit = async () => {
    setJDPreview('');
    setJDError('');
    if (!jdText.trim()) return;
    setLoadingJD(true);
    const formData = new FormData();
    formData.append('text', jdText);
    try {
      const res = await fetch(`${BACKEND_URL}/upload_jd/`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setJDPreview(data.text);
        addNotification('success', 'Job description text submitted and extracted successfully.');
      } else {
        setJDError(data.error || 'Error uploading JD text');
        addNotification('error', data.error || 'Error uploading JD text');
      }
    } catch (err) {
      setJDError('Network error');
      addNotification('error', 'Network error while submitting JD text');
    }
    setLoadingJD(false);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setAnalysisResult(null);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      // 1. Main analysis
      const res = await fetch(`${BACKEND_URL}/analyze_resume/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: resumePreview, category: selectedCategory }),
      });
      const data = await res.json();
      let parseData = null;
      // 2. Parse resume entities (skills, education, experience, orgs, dates)
      try {
        const parseRes = await fetch(`${BACKEND_URL}/parse_resume/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: resumePreview }),
        });
        parseData = await parseRes.json();
      } catch (err) {
        parseData = { error: 'Failed to extract entities' };
      }
      if (res.ok) {
        setAnalysisResult({ ...data, entities: parseData });
        addNotification('success', 'Resume analyzed successfully.');
      } else {
        setAnalysisResult({ error: data.error || 'Analysis failed', entities: parseData });
        addNotification('error', data.error || 'Analysis failed');
      }
    } catch (err) {
      setAnalysisResult({ error: 'Network error' });
      addNotification('error', 'Network error while analyzing resume');
    }
    setAnalyzing(false);
  };

  // Determine current step for Stepper
  let activeStep = 0;
  if (resumeFile) activeStep = 1;
  if (resumePreview && selectedCategory) activeStep = 2;
  if ((jdFile || jdText || jdPreview) && selectedCategory) activeStep = 3;

  return (
    <Box sx={{ minHeight: '100vh', background: isDark ? theme.palette.background.default : 'linear-gradient(135deg, #f7f9fa 60%, #e3eafc 100%)', py: 6 }}>
      <Grid container justifyContent="center">
        <Grid item xs={12} md={8} lg={6}>
          <Card elevation={6} sx={{ borderRadius: 4, background: isDark ? theme.palette.background.paper : undefined }}>
            <CardHeader
              avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><AssignmentIcon /></Avatar>}
              title={<Typography variant="h5" sx={{ fontWeight: 700 }}>Resume & JD Upload</Typography>}
              subheader={<Typography variant="subtitle1" color="text.secondary">Get your resume analyzed in a few easy steps</Typography>}
              sx={{ pb: 0 }}
            />
            <CardContent>
              <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              {/* Resume Upload Section */}
              <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3, background: isDark ? theme.palette.background.paper : '#f8fafc' }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <UploadFileIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>1. Upload Resume</Typography>
                </Box>
                <Button variant="contained" component="label" startIcon={<UploadFileIcon />} size="large" sx={{ mb: 2 }}>
                  {resumeFile ? 'Change Resume' : 'Upload Resume (.pdf, .docx)'}
                  <input type="file" accept=".pdf,.docx" hidden onChange={handleResumeChange} />
                </Button>
                {loadingResume && <CircularProgress size={24} sx={{ ml: 2, verticalAlign: 'middle' }} />}
                {resumeFile && <Typography variant="body2" sx={{ mt: 1 }}><b>Selected:</b> {resumeFile.name}</Typography>}
                {resumeError && <Typography variant="body2" color="error" sx={{ mt: 1 }}>{resumeError}</Typography>}
                {resumePreview && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: isDark ? theme.palette.background.default : '#f5f5f5', borderRadius: 2, maxHeight: 180, overflow: 'auto' }}>
                    <Typography variant="caption" color="text.secondary">Preview:</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{resumePreview}</Typography>
                  </Box>
                )}
                {resumePreview && (
                  <FormControl fullWidth sx={{ mt: 3 }}>
                    <MuiInputLabel id="category-label">Select Category</MuiInputLabel>
                    <Select
                      labelId="category-label"
                      value={selectedCategory}
                      label="Select Category"
                      onChange={handleCategoryChange}
                    >
                      {categories.map((cat) => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Paper>
              {/* JD Upload Section */}
              <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3, background: isDark ? theme.palette.background.paper : '#f8fafc' }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <DescriptionIcon color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>2. Job Description</Typography>
                </Box>
                <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} sx={{ mr: 2, mb: 2 }}>
                  {jdFile ? 'Change JD' : 'Upload JD (.pdf, .docx)'}
                  <input type="file" accept=".pdf,.docx" hidden onChange={handleJDFileChange} />
                </Button>
                {loadingJD && <CircularProgress size={24} sx={{ ml: 2, verticalAlign: 'middle' }} />}
                {jdFile && <Typography variant="body2" sx={{ mt: 1 }}><b>Selected:</b> {jdFile.name}</Typography>}
                <Divider sx={{ my: 2 }}>or</Divider>
                <InputLabel htmlFor="jd-text">Paste JD text:</InputLabel>
                <TextField
                  id="jd-text"
                  multiline
                  minRows={4}
                  fullWidth
                  value={jdText}
                  onChange={handleJDTextChange}
                  placeholder="Paste job description here..."
                  sx={{ mt: 1 }}
                />
                <Button variant="contained" sx={{ mt: 2 }} onClick={handleJDTextSubmit} disabled={loadingJD || !jdText.trim()}>
                  Submit JD Text
                </Button>
                {jdError && <Typography variant="body2" color="error" sx={{ mt: 1 }}>{jdError}</Typography>}
                {jdPreview && <Box sx={{ mt: 2, p: 2, bgcolor: isDark ? theme.palette.background.default : '#f5f5f5', borderRadius: 2, maxHeight: 120, overflow: 'auto' }}><Typography variant="caption">Preview:</Typography><Typography variant="body2">{jdPreview}</Typography></Box>}
              </Paper>
              {/* Analyze Section */}
              <Box textAlign="center" mt={4}>
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  startIcon={<CheckCircleIcon />}
                  onClick={handleAnalyze}
                  disabled={!resumePreview || !selectedCategory || !(jdFile || jdText || jdPreview) || analyzing}
                  sx={{ px: 5, py: 1.5, fontWeight: 600, fontSize: '1.1rem', borderRadius: 3 }}
                >
                  {analyzing ? <CircularProgress size={24} color="inherit" /> : 'Analyze Resume'}
                </Button>
                {analysisResult && (
                  <Paper elevation={3} sx={{ mt: 4, p: 3, borderRadius: 3, background: isDark ? theme.palette.background.paper : '#f0f7fa' }}>
                    {analysisResult.error ? (
                      <Typography variant="body2" color="error">{analysisResult.error}</Typography>
                    ) : (
                      <>
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>Similarity Score: {analysisResult.similarity?.toFixed(3)}</Typography>
                        <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 600 }}>Top Skills for {selectedCategory}:</Typography>
                        <Box component="ul" sx={{ pl: 3, mt: 1 }}>
                          {analysisResult.top_skills?.map((skill) => (
                            <li key={skill}><Typography variant="body2">{skill}</Typography></li>
                          ))}
                        </Box>
                        {/* More analysis: show extracted entities */}
                        {analysisResult.entities && !analysisResult.entities.error && (
                          <Box sx={{ mt: 3 }}>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Resume Entities Extracted:</Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6} md={4}>
                                <Typography variant="subtitle2">Skills:</Typography>
                                <ul style={{ margin: 0, paddingLeft: 18 }}>
                                  {analysisResult.entities.skills?.length ? analysisResult.entities.skills.map((s, i) => <li key={i}>{s}</li>) : <li>None found</li>}
                                </ul>
                              </Grid>
                              <Grid item xs={12} sm={6} md={4}>
                                <Typography variant="subtitle2">Education:</Typography>
                                <ul style={{ margin: 0, paddingLeft: 18 }}>
                                  {analysisResult.entities.education?.length ? analysisResult.entities.education.map((e, i) => <li key={i}>{e}</li>) : <li>None found</li>}
                                </ul>
                              </Grid>
                              <Grid item xs={12} sm={6} md={4}>
                                <Typography variant="subtitle2">Experience:</Typography>
                                <ul style={{ margin: 0, paddingLeft: 18 }}>
                                  {analysisResult.entities.experience?.length ? analysisResult.entities.experience.map((e, i) => <li key={i}>{e}</li>) : <li>None found</li>}
                                </ul>
                              </Grid>
                              <Grid item xs={12} sm={6} md={4}>
                                <Typography variant="subtitle2">Organizations:</Typography>
                                <ul style={{ margin: 0, paddingLeft: 18 }}>
                                  {analysisResult.entities.organizations?.length ? analysisResult.entities.organizations.map((o, i) => <li key={i}>{o}</li>) : <li>None found</li>}
                                </ul>
                              </Grid>
                              <Grid item xs={12} sm={6} md={4}>
                                <Typography variant="subtitle2">Dates:</Typography>
                                <ul style={{ margin: 0, paddingLeft: 18 }}>
                                  {analysisResult.entities.dates?.length ? analysisResult.entities.dates.map((d, i) => <li key={i}>{d}</li>) : <li>None found</li>}
                                </ul>
                              </Grid>
                            </Grid>
                          </Box>
                        )}
                        {analysisResult.entities && analysisResult.entities.error && (
                          <Typography variant="body2" color="error" sx={{ mt: 2 }}>{analysisResult.entities.error}</Typography>
                        )}
                      </>
                    )}
                  </Paper>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FileUpload; 