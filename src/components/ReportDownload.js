import React from 'react';
import { Button } from '@mui/material';

const ReportDownload = ({ onDownload }) => {
  return (
    <Button variant="contained" color="primary" onClick={onDownload} sx={{ mt: 2 }}>
      Download PDF Report
    </Button>
  );
};

export default ReportDownload; 