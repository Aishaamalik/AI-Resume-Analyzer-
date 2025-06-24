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
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 