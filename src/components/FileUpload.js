import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, TextField, InputLabel, CircularProgress, MenuItem, Select, FormControl, InputLabel as MuiInputLabel } from '@mui/material';
import { useNotification } from './NotificationProvider';
import { useResumeAnalysis } from './ResumeAnalysisProvider';

const BACKEND_URL = 'http://127.0.0.1:8000';

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
      const res = await fetch(`${BACKEND_URL}/analyze_resume/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: resumePreview, category: selectedCategory }),
      });
      const data = await res.json();
      if (res.ok) {
        setAnalysisResult(data);
        addNotification('success', 'Resume analyzed successfully.');
      } else {
        setAnalysisResult({ error: data.error || 'Analysis failed' });
        addNotification('error', data.error || 'Analysis failed');
      }
    } catch (err) {
      setAnalysisResult({ error: 'Network error' });
      addNotification('error', 'Network error while analyzing resume');
    }
    setAnalyzing(false);
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>Upload Resume</Typography>
      <Button variant="contained" component="label">
        Upload Resume (.pdf, .docx)
        <input type="file" accept=".pdf,.docx" hidden onChange={handleResumeChange} />
      </Button>
      {loadingResume && <CircularProgress size={20} sx={{ ml: 2 }} />}
      {resumeFile && <Typography variant="body2">Selected: {resumeFile.name}</Typography>}
      {resumeError && <Typography variant="body2" color="error">{resumeError}</Typography>}
      {resumePreview && <Box sx={{ mt: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="caption">Preview:</Typography>
        <Typography variant="body2">{resumePreview}</Typography>
        <FormControl fullWidth sx={{ mt: 2 }}>
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
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={handleAnalyze}
          disabled={!selectedCategory || analyzing}
        >
          {analyzing ? <CircularProgress size={20} /> : 'Analyze Resume'}
        </Button>
        {analysisResult && (
          <Box sx={{ mt: 2 }}>
            {analysisResult.error ? (
              <Typography variant="body2" color="error">{analysisResult.error}</Typography>
            ) : (
              <>
                <Typography variant="subtitle1">Similarity Score: {analysisResult.similarity?.toFixed(3)}</Typography>
                <Typography variant="subtitle2" sx={{ mt: 1 }}>Top Skills for {selectedCategory}:</Typography>
                <ul>
                  {analysisResult.top_skills?.map((skill) => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>
              </>
            )}
          </Box>
        )}
      </Box>}
      <Box mt={3}>
        <Typography variant="h6" gutterBottom>Job Description</Typography>
        <Button variant="outlined" component="label" sx={{ mr: 2 }}>
          Upload JD (.pdf, .docx)
          <input type="file" accept=".pdf,.docx" hidden onChange={handleJDFileChange} />
        </Button>
        {loadingJD && <CircularProgress size={20} sx={{ ml: 2 }} />}
        {jdFile && <Typography variant="body2">Selected: {jdFile.name}</Typography>}
        <Box mt={2}>
          <InputLabel htmlFor="jd-text">Or paste JD text:</InputLabel>
          <TextField
            id="jd-text"
            multiline
            minRows={4}
            fullWidth
            value={jdText}
            onChange={handleJDTextChange}
            placeholder="Paste job description here..."
          />
          <Button variant="contained" sx={{ mt: 1 }} onClick={handleJDTextSubmit} disabled={loadingJD || !jdText.trim()}>
            Submit JD Text
          </Button>
        </Box>
        {jdError && <Typography variant="body2" color="error">{jdError}</Typography>}
        {jdPreview && <Box sx={{ mt: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}><Typography variant="caption">Preview:</Typography><Typography variant="body2">{jdPreview}</Typography></Box>}
      </Box>
    </Box>
  );
};

export default FileUpload; 