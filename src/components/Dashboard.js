import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Dashboard = ({ skillsData, missingSkills, summary }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Resume Analysis Dashboard</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        {/* Radar chart placeholder */}
        <Typography variant="subtitle1">Skills Match (Radar Chart)</Typography>
        <Box sx={{ height: 250, background: '#f5f5f5', mb: 2 }} />
        {/* Bar chart placeholder */}
        <Typography variant="subtitle1">Missing Skills (Bar Chart)</Typography>
        <Box sx={{ height: 200, background: '#f5f5f5', mb: 2 }} />
        {/* Summary list placeholder */}
        <Typography variant="subtitle1">Improvement Areas</Typography>
        <Box sx={{ background: '#f5f5f5', p: 2 }}>
          <ul>
            <li>Example: Add more Python experience</li>
            <li>Example: Highlight leadership roles</li>
          </ul>
        </Box>
      </Paper>
    </Box>
  );
};

export default Dashboard; 