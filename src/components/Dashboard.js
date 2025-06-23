import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { useResumeAnalysis } from './ResumeAnalysisProvider';
import { Radar, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  RadialLinearScale,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { resumePreview, selectedCategory, analysisResult } = useResumeAnalysis();

  // Skill gap analysis
  let matchedSkills = [], missingSkills = [], recommendations = [];
  if (analysisResult && analysisResult.top_skills) {
    const resumeText = resumePreview.toLowerCase();
    matchedSkills = analysisResult.top_skills.filter(skill => resumeText.includes(skill));
    missingSkills = analysisResult.top_skills.filter(skill => !resumeText.includes(skill));
    recommendations = missingSkills.map(skill => `Consider adding or highlighting the skill: "${skill}" in your resume.`);
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
    <Box>
      <Typography variant="h5" gutterBottom>Resume Analysis Dashboard</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1">Selected Category: {selectedCategory || 'None'}</Typography>
        <Typography variant="subtitle1">Resume Preview:</Typography>
        <Box sx={{ bgcolor: '#f5f5f5', p: 1, borderRadius: 1, mb: 2 }}>
          <Typography variant="body2">{resumePreview || 'No resume uploaded.'}</Typography>
        </Box>
        {analysisResult ? (
          <>
            <Typography variant="subtitle1">Similarity Score: {analysisResult.similarity?.toFixed(3)}</Typography>
            <Typography variant="subtitle2" sx={{ mt: 1 }}>Top Skills for {selectedCategory}:</Typography>
            <ul>
              {analysisResult.top_skills?.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Skills Match (Radar Chart)</Typography>
                <Radar data={radarData} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Missing Skills (Bar Chart)</Typography>
                <Bar data={barData} options={{ indexAxis: 'y' }} />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1">Matched Skills</Typography>
              <ul>
                {matchedSkills.map(skill => <li key={skill}>{skill}</li>)}
              </ul>
              <Typography variant="subtitle1">Missing Skills</Typography>
              <ul>
                {missingSkills.map(skill => <li key={skill}>{skill}</li>)}
              </ul>
              <Typography variant="subtitle1" sx={{ mt: 2 }}>Recommendations</Typography>
              <ul>
                {recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
              </ul>
            </Box>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">No analysis result yet. Please analyze a resume first.</Typography>
        )}
      </Paper>
    </Box>
  );
};

export default Dashboard; 