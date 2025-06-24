import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, Chip, Divider, Collapse, IconButton, Tooltip, Alert } from '@mui/material';
import { useResumeAnalysis } from './ResumeAnalysisProvider';
import { Radar, Bar } from 'react-chartjs-2';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CategoryIcon from '@mui/icons-material/Category';
import ScoreIcon from '@mui/icons-material/Score';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import InfoIcon from '@mui/icons-material/Info';
import DescriptionIcon from '@mui/icons-material/Description';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiPeopleIcon from '@mui/icons-material/EmojiPeople';
import AssessmentIcon from '@mui/icons-material/Assessment';
import {
  Chart as ChartJS,
  RadialLinearScale,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { useTheme } from '@mui/material/styles';

ChartJS.register(
  RadialLinearScale,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTooltip,
  Legend
);

const Dashboard = () => {
  const { resumePreview, selectedCategory, analysisResult } = useResumeAnalysis();
  const [showPreview, setShowPreview] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Skill gap analysis
  let matchedSkills = [], missingSkills = [], recommendations = [];
  if (analysisResult && analysisResult.all_skills) {
    const resumeText = resumePreview.toLowerCase();
    matchedSkills = analysisResult.all_skills.filter(skill => resumeText.includes(skill));
    missingSkills = analysisResult.all_skills.filter(skill => !resumeText.includes(skill));
    recommendations = missingSkills;
  }

  // Radar chart data
  const radarData = {
    labels: analysisResult?.top_skills || [],
    datasets: [
      {
        label: 'Matched Skills',
        data: (analysisResult?.top_skills || []).map(skill => matchedSkills.includes(skill) ? 1 : 0),
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
      },
    ],
  };

  // Bar chart data for missing skills
  const barData = {
    labels: missingSkills,
    datasets: [
      {
        label: 'Missing Skill (importance)',
        data: missingSkills.map(() => 1),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, background: isDark ? theme.palette.background.default : '#f7f9fa', minHeight: '100vh' }}>
      <Typography variant="h5" gutterBottom align="center" sx={{ fontWeight: 600, mb: 3 }}>
        <ListAltIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Resume Analysis Dashboard
      </Typography>
      <Grid container spacing={3}>
        {/* Summary Card */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, mb: 2, textAlign: 'center', background: isDark ? theme.palette.background.paper : undefined }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
              <CategoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />Category
            </Typography>
            <Typography variant="h6" color="primary" sx={{ mb: 2 }}>{selectedCategory || 'None'}</Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
              <ScoreIcon sx={{ mr: 1, verticalAlign: 'middle' }} />Similarity Score
            </Typography>
            <Typography variant="h4" color="secondary" sx={{ fontWeight: 700, mb: 1 }}>
              {analysisResult?.similarity !== undefined ? analysisResult.similarity?.toFixed(3) : '--'}
            </Typography>
          </Paper>
          <Paper elevation={2} sx={{ p: 2, mb: 2, background: isDark ? theme.palette.background.paper : undefined }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                <DescriptionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />Resume Preview
              </Typography>
              <Tooltip title={showPreview ? 'Hide Preview' : 'Show Preview'}>
                <IconButton onClick={() => setShowPreview((v) => !v)}>
                  <ExpandMoreIcon sx={{ transform: showPreview ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />
                </IconButton>
              </Tooltip>
            </Box>
            <Collapse in={showPreview}>
              <Box sx={{ bgcolor: isDark ? theme.palette.background.default : '#f5f5f5', p: 1, borderRadius: 1, mt: 1, maxHeight: 200, overflow: 'auto' }}>
                <Typography variant="body2">{resumePreview || 'No resume uploaded.'}</Typography>
              </Box>
            </Collapse>
          </Paper>
        </Grid>
        {/* Charts and Skills */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, mb: 2, background: isDark ? theme.palette.background.paper : undefined }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 2 }}>
              <CheckCircleIcon sx={{ color: 'success.main', mr: 1, verticalAlign: 'middle' }} />Matched Skills
            </Typography>
            {matchedSkills.length > 0 ? (
              <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {matchedSkills.map(skill => (
                  <Chip key={skill} label={skill} color="success" variant="filled" />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">No matched skills found.</Typography>
            )}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 2 }}>
              <HighlightOffIcon sx={{ color: 'error.main', mr: 1, verticalAlign: 'middle' }} />Missing Skills
            </Typography>
            {missingSkills.length > 0 ? (
              <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {missingSkills.map(skill => (
                  <Chip key={skill} label={skill} color="error" variant="outlined" />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">No missing skills detected.</Typography>
            )}
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
                  <CheckCircleIcon sx={{ color: 'primary.main', mr: 1, verticalAlign: 'middle' }} />Skills Match (Radar Chart)
                </Typography>
                <Radar data={radarData} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
                  <HighlightOffIcon sx={{ color: 'primary.main', mr: 1, verticalAlign: 'middle' }} />Missing Skills (Bar Chart)
                </Typography>
                <Bar data={barData} options={{ indexAxis: 'y' }} />
              </Grid>
            </Grid>
          </Paper>
          {recommendations.length > 0 && (
            <Alert icon={<InfoIcon fontSize="inherit" />} severity="info" sx={{ mt: 2, fontSize: 16, background: isDark ? theme.palette.background.paper : undefined, color: isDark ? '#fff' : undefined }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>Recommended Skills to Add or Highlight</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {recommendations.map((rec, i) => (
                  <Chip key={i} label={rec} color="primary" variant="outlined" />
                ))}
              </Box>
            </Alert>
          )}
          {/* Timeline & Consistency Check Section */}
          {analysisResult?.timeline_report && (
            <Paper elevation={2} sx={{ p: 3, mt: 3, background: isDark ? theme.palette.background.paper : undefined }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 2 }}>
                <TimelineIcon sx={{ color: 'info.main', mr: 1, verticalAlign: 'middle' }} />Timeline & Consistency Check
              </Typography>
              {analysisResult.timeline_report.issues?.length === 0 ? (
                <Alert severity="success">No timeline gaps or overlaps detected.</Alert>
              ) : (
                <Box>
                  {analysisResult.timeline_report.issues?.map((issue, idx) => (
                    <Alert key={idx} severity="warning" sx={{ mb: 1 }}>{issue}</Alert>
                  ))}
                </Box>
              )}
              {/* Optionally show parsed date ranges for transparency */}
              {analysisResult.timeline_report.parsed_dates?.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <b>Extracted Date Ranges:</b>
                  </Typography>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {analysisResult.timeline_report.parsed_dates.map(([start, end, label], i) => (
                      <li key={i}><span style={{ fontFamily: 'monospace' }}>{label}</span> &rarr; <span style={{ fontFamily: 'monospace' }}>{start} - {end}</span></li>
                    ))}
                  </ul>
                </Box>
              )}
            </Paper>
          )}
          {/* Career Path Suggestions Section */}
          {analysisResult?.career_suggestions && (
            <Paper elevation={2} sx={{ p: 3, mt: 3, background: isDark ? theme.palette.background.paper : undefined }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 2 }}>
                <TrendingUpIcon sx={{ color: 'success.main', mr: 1, verticalAlign: 'middle' }} />Career Path Suggestions
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>Next Possible Roles/Job Titles:</Typography>
                {analysisResult.career_suggestions.next_roles?.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {analysisResult.career_suggestions.next_roles.map((role, i) => (
                      <Chip key={i} label={role} color="secondary" variant="outlined" />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">No suggestions available.</Typography>
                )}
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>Upskilling Suggestions:</Typography>
                {analysisResult.career_suggestions.upskilling?.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {analysisResult.career_suggestions.upskilling.map((skill, i) => (
                      <Chip key={i} label={skill} color="primary" variant="outlined" />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">No upskilling suggestions at this time.</Typography>
                )}
              </Box>
            </Paper>
          )}
          {/* Soft Skills Detection Section */}
          {analysisResult?.soft_skills && (
            <Paper elevation={2} sx={{ p: 3, mt: 3, background: isDark ? theme.palette.background.paper : undefined }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 2 }}>
                <EmojiPeopleIcon sx={{ color: 'warning.main', mr: 1, verticalAlign: 'middle' }} />Soft Skills Detected
              </Typography>
              {analysisResult.soft_skills.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {analysisResult.soft_skills.map((skill, i) => (
                    <Chip key={i} label={skill} color="warning" variant="outlined" />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">No soft skills detected in the resume.</Typography>
              )}
            </Paper>
          )}
          {/* Readability & ATS Optimization Section */}
          {analysisResult?.readability_ats_report && (
            <Paper elevation={2} sx={{ p: 3, mt: 3, background: isDark ? theme.palette.background.paper : undefined }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 2 }}>
                <AssessmentIcon sx={{ color: 'info.main', mr: 1, verticalAlign: 'middle' }} />Resume Readability & ATS Optimization
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>Flesch Reading Ease:</Typography>
                <Chip label={analysisResult.readability_ats_report.flesch_reading_ease !== null ? analysisResult.readability_ats_report.flesch_reading_ease.toFixed(1) : 'N/A'} color="info" />
                <Typography variant="body2" sx={{ fontWeight: 500, mt: 1 }}>Flesch-Kincaid Grade:</Typography>
                <Chip label={analysisResult.readability_ats_report.flesch_kincaid_grade !== null ? analysisResult.readability_ats_report.flesch_kincaid_grade.toFixed(1) : 'N/A'} color="info" />
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>Buzzword Overuse:</Typography>
                {Object.keys(analysisResult.readability_ats_report.buzzword_counts || {}).length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {Object.entries(analysisResult.readability_ats_report.buzzword_counts).map(([bw, count], i) => (
                      <Chip key={i} label={`${bw} (${count})`} color={count > 2 ? 'error' : 'default'} variant="outlined" />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">No buzzwords detected.</Typography>
                )}
                {analysisResult.readability_ats_report.buzzword_flag && (
                  <Alert severity="warning" sx={{ mt: 1 }}>Overuse of buzzwords detected. Consider reducing them for clarity.</Alert>
                )}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>Passive Voice:</Typography>
                <Typography variant="body2">Count: {analysisResult.readability_ats_report.passive_voice_count}</Typography>
                {analysisResult.readability_ats_report.passive_voice_examples?.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">Examples:</Typography>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {analysisResult.readability_ats_report.passive_voice_examples.map((ex, i) => (
                        <li key={i}><span style={{ fontFamily: 'monospace' }}>{ex}</span></li>
                      ))}
                    </ul>
                  </Box>
                )}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>Section Headers:</Typography>
                <Typography variant="body2" color="success.main">Found: {analysisResult.readability_ats_report.section_headers_found.join(', ') || 'None'}</Typography>
                <Typography variant="body2" color="error.main">Missing: {analysisResult.readability_ats_report.section_headers_missing.join(', ') || 'None'}</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>ATS Keyword Frequency:</Typography>
                {Object.keys(analysisResult.readability_ats_report.ats_keyword_frequency || {}).length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {Object.entries(analysisResult.readability_ats_report.ats_keyword_frequency).map(([kw, count], i) => (
                      <Chip key={i} label={`${kw} (${count})`} color={count === 0 ? 'error' : 'primary'} variant="outlined" />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">No ATS keywords checked.</Typography>
                )}
                {analysisResult.readability_ats_report.ats_missing_keywords?.length > 0 && (
                  <Alert severity="warning" sx={{ mt: 1 }}>Some important keywords are missing for ATS optimization.</Alert>
                )}
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 