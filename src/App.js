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
import TrainedDatasetDashboardPage from './pages/TrainedDatasetDashboardPage';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [tab, setTab] = useState(0);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          ...(darkMode && {
            background: {
              default: '#181a1b',
              paper: '#23272a',
            },
            text: {
              primary: '#fff',
              secondary: '#b0b3b8',
            },
          }),
        },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: darkMode
                ? {
                    backgroundColor: '#23272a',
                    color: '#fff',
                  }
                : {},
            },
          },
          MuiCard: {
            styleOverrides: {
              root: darkMode
                ? {
                    backgroundColor: '#23272a',
                    color: '#fff',
                  }
                : {},
            },
          },
          MuiBox: {
            styleOverrides: {
              root: darkMode
                ? {
                    backgroundColor: '#181a1b',
                    color: '#fff',
                  }
                : {},
            },
          },
          MuiAlert: {
            styleOverrides: {
              root: darkMode
                ? {
                    backgroundColor: '#23272a',
                    color: '#fff',
                  }
                : {},
            },
          },
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
                  <Tab label="Dataset Analysis" component={Link} to="/dataset-dashboard" />
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
                <Route path="/dataset-dashboard" element={<TrainedDatasetDashboardPage />} />
              </Routes>
            </Box>
          </Router>
        </ResumeAnalysisProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
