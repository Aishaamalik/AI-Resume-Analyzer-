import React, { useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline, AppBar, Toolbar, Typography, IconButton, Box, Tabs, Tab } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ResumeUploadPage from './pages/ResumeUploadPage';
import AnalysisDashboardPage from './pages/AnalysisDashboardPage';
import NotificationProvider from './components/NotificationProvider';
import NotificationTab from './components/NotificationTab';
import ResumeAnalysisProvider from './components/ResumeAnalysisProvider';
import NotificationMenu from './components/NotificationMenu';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [tab, setTab] = useState(0);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
        },
      }),
    [darkMode]
  );

  const handleThemeToggle = () => setDarkMode((prev) => !prev);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationProvider>
        <ResumeAnalysisProvider>
          <Router>
            <AppBar position="static">
              <Toolbar>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  AI-Powered Resume Analyzer
                </Typography>
                <Tabs
                  value={tab}
                  onChange={(_, v) => setTab(v)}
                  textColor="inherit"
                  indicatorColor="secondary"
                  sx={{ minHeight: 48 }}
                >
                  <Tab label="Resume Upload" component={Link} to="/" />
                  <Tab label="Analysis Dashboard" component={Link} to="/dashboard" />
                </Tabs>
                <NotificationMenu />
                <IconButton sx={{ ml: 2 }} onClick={handleThemeToggle} color="inherit">
                  {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
              </Toolbar>
            </AppBar>
            <Box sx={{ p: 2 }}>
              <Routes>
                <Route path="/" element={<ResumeUploadPage />} />
                <Route path="/dashboard" element={<AnalysisDashboardPage />} />
              </Routes>
            </Box>
          </Router>
        </ResumeAnalysisProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
