import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, MenuItem, Select, FormControl, InputLabel, Accordion, AccordionSummary, AccordionDetails, Divider } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useNotification } from '../components/NotificationProvider';
import { useTheme } from '@mui/material/styles';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const COLORS = {
  blue: 'rgba(54, 162, 235, 0.7)',
  teal: 'rgba(0, 191, 165, 0.7)',
  purple: 'rgba(156, 39, 176, 0.7)',
  green: 'rgba(76, 175, 80, 0.7)',
  red: 'rgba(255, 99, 132, 0.7)',
  gray: 'rgba(120, 144, 156, 0.7)',
};

const TrainedDatasetDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [eda, setEda] = useState(() => {
    const saved = localStorage.getItem('dashboard_eda');
    return saved ? JSON.parse(saved) : null;
  });
  const [histogram, setHistogram] = useState(() => {
    const saved = localStorage.getItem('dashboard_histogram');
    return saved ? JSON.parse(saved) : null;
  });
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return localStorage.getItem('dashboard_selectedCategory') || '';
  });
  const [catSkills, setCatSkills] = useState(() => {
    const saved = localStorage.getItem('dashboard_catSkills');
    return saved ? JSON.parse(saved) : [];
  });
  const [heatmap, setHeatmap] = useState(() => {
    const saved = localStorage.getItem('dashboard_heatmap');
    return saved ? JSON.parse(saved) : null;
  });
  const { addNotification } = useNotification();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Save to localStorage on state change
  React.useEffect(() => {
    if (eda) localStorage.setItem('dashboard_eda', JSON.stringify(eda));
  }, [eda]);
  React.useEffect(() => {
    if (histogram) localStorage.setItem('dashboard_histogram', JSON.stringify(histogram));
  }, [histogram]);
  React.useEffect(() => {
    if (selectedCategory) localStorage.setItem('dashboard_selectedCategory', selectedCategory);
  }, [selectedCategory]);
  React.useEffect(() => {
    if (catSkills) localStorage.setItem('dashboard_catSkills', JSON.stringify(catSkills));
  }, [catSkills]);
  React.useEffect(() => {
    if (heatmap) localStorage.setItem('dashboard_heatmap', JSON.stringify(heatmap));
  }, [heatmap]);

  useEffect(() => {
    if (eda) {
      // Already loaded from localStorage
      setLoading(false);
      if (eda.top_categories && eda.top_categories.length > 0 && !selectedCategory) {
        setCategories(eda.top_categories.map(c => c.category));
        setSelectedCategory(eda.top_categories[0].category);
      }
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://127.0.0.1:8000/dataset_summary/');
        const data = await res.json();
        setEda(data);
        if (data.top_categories && data.top_categories.length > 0) {
          const cats = data.top_categories.map(c => c.category);
          setCategories(cats);
          setSelectedCategory(data.top_categories[0].category);
        }
        addNotification('success', 'Dataset summary loaded successfully.');
      } catch (err) {
        setEda(null);
        setCategories([]);
        setSelectedCategory('');
        addNotification('error', 'Error fetching dataset summary.');
      }
      setLoading(false);
    };
    fetchData();
  }, [addNotification]);

  useEffect(() => {
    if (histogram) return;
    const fetchHistogram = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/resume_length_histogram/');
        setHistogram(await res.json());
        addNotification('success', 'Resume length histogram loaded.');
      } catch (err) {
        addNotification('error', 'Error fetching resume length histogram.');
      }
    };
    fetchHistogram();
  }, [addNotification]);

  useEffect(() => {
    if (!selectedCategory) return;
    if (catSkills && catSkills.length > 0) return;
    const fetchCatSkills = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/category_skill_frequency/?category=${encodeURIComponent(selectedCategory)}`);
        const data = await res.json();
        setCatSkills(data.top_words);
        addNotification('success', `Top skills for ${selectedCategory} loaded.`);
      } catch (err) {
        addNotification('error', `Error fetching skills for ${selectedCategory}.`);
      }
    };
    fetchCatSkills();
  }, [selectedCategory, addNotification]);

  useEffect(() => {
    if (heatmap) return;
    const fetchHeatmap = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/skill_category_heatmap/');
        setHeatmap(await res.json());
        addNotification('success', 'Skill-category heatmap loaded.');
      } catch (err) {
        addNotification('error', 'Error fetching skill-category heatmap.');
      }
    };
    fetchHeatmap();
  }, [addNotification]);

  // Bar chart for top categories
  const barDataCategories = {
    labels: eda?.top_categories?.map((c) => c.category) || [],
    datasets: [
      {
        label: 'Resume Count',
        data: eda?.top_categories?.map((c) => c.count) || [],
        backgroundColor: COLORS.blue,
      },
    ],
  };

  // Bar chart for top words/skills
  const barDataSkills = {
    labels: eda?.top_words?.map((s) => s.word) || [],
    datasets: [
      {
        label: 'Frequency',
        data: eda?.top_words?.map((s) => s.count) || [],
        backgroundColor: COLORS.red,
      },
    ],
  };

  // Histogram for resume lengths
  const histData = histogram
    ? {
        labels: histogram.bins.slice(0, -1).map((b, i) => `${b}-${histogram.bins[i + 1]}`),
        datasets: [
          {
            label: 'Resume Count',
            data: histogram.counts,
            backgroundColor: COLORS.teal,
          },
        ],
      }
    : null;

  // Bar chart for selected category's top skills
  const catSkillBarData = catSkills.length > 0
    ? {
        labels: catSkills.map(s => s.word),
        datasets: [
          {
            label: `Top Skills in ${selectedCategory}`,
            data: catSkills.map(s => s.count),
            backgroundColor: COLORS.green,
          },
        ],
      }
    : null;

  // Bar chart for most common curated skills
  const barDataMostCommonSkills = eda?.most_common_skills
    ? {
        labels: eda.most_common_skills.slice(0, 15).map(([skill]) => skill),
        datasets: [
          {
            label: 'Most Common Curated Skills',
            data: eda.most_common_skills.slice(0, 15).map(([, count]) => count),
            backgroundColor: COLORS.purple,
          },
        ],
      }
    : null;

  // Table for top curated skills per category
  const renderTopSkillsPerCategory = () => {
    if (!eda?.top_skills_per_category) return null;
    return (
      <TableContainer component={Paper} sx={{ mt: 1, mb: 2, background: isDark ? theme.palette.background.paper : undefined }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell>Curated Top Skills</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(eda.top_skills_per_category).map(([cat, skills]) => (
              <TableRow key={cat}>
                <TableCell>{cat}</TableCell>
                <TableCell>{skills.join(', ')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Table for skill coverage per category
  const renderSkillCoveragePerCategory = () => {
    if (!eda?.skill_coverage_per_category) return null;
    return (
      <TableContainer component={Paper} sx={{ mt: 1, mb: 2, background: isDark ? theme.palette.background.paper : undefined }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell>Skill</TableCell>
              <TableCell>Coverage (%)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(eda.skill_coverage_per_category).map(([cat, skills]) =>
              Object.entries(skills).map(([skill, coverage]) => (
                <TableRow key={cat + skill}>
                  <TableCell>{cat}</TableCell>
                  <TableCell>{skill}</TableCell>
                  <TableCell>{(coverage * 100).toFixed(1)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Improved heatmap (categories vs. curated skills, with % coverage)
  const renderCuratedSkillHeatmap = () => {
    if (!eda?.heatmap_categories || !eda?.heatmap_skills || !eda?.heatmap_matrix) return null;
    const maxVal = Math.max(...eda.heatmap_matrix.flat());
    return (
      <TableContainer component={Paper} sx={{ mt: 1, mb: 2, background: isDark ? theme.palette.background.paper : undefined }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Category \ Skill</TableCell>
              {eda.heatmap_skills.map(skill => (
                <TableCell key={skill}>{skill}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {eda.heatmap_categories.map((cat, i) => (
              <TableRow key={cat}>
                <TableCell>{cat}</TableCell>
                {eda.heatmap_matrix[i].map((val, j) => (
                  <TableCell key={j} sx={{ bgcolor: `rgba(33, 150, 243, ${Math.min(val / maxVal, 1)})`, color: val > 0.5 * maxVal ? '#fff' : '#000' }}>{(val * 100).toFixed(1)}%</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, background: isDark ? theme.palette.background.default : '#f7f9fa', minHeight: '100vh' }}>
      <Typography variant="h5" gutterBottom align="center" sx={{ fontWeight: 600, mb: 3 }}>
        Trained Dataset EDA Dashboard
      </Typography>
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2, mb: 2, background: isDark ? theme.palette.background.paper : undefined }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Dataset Summary</Typography>
            <Divider sx={{ my: 1 }} />
            <Grid container spacing={1}>
              <Grid item xs={6}><Typography variant="body2">Total Resumes</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2" sx={{ fontWeight: 600 }}>{eda?.summary.total_resumes}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2">Unique Categories</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2" sx={{ fontWeight: 600 }}>{eda?.summary.unique_categories}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2">Top Skill/Word</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2" sx={{ fontWeight: 600 }}>{eda?.summary.top_skill}</Typography></Grid>
            </Grid>
          </Paper>
          <Paper elevation={2} sx={{ p: 2, background: isDark ? theme.palette.background.paper : undefined }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Resume Length Stats</Typography>
            <Divider sx={{ my: 1 }} />
            <Grid container spacing={1}>
              <Grid item xs={6}><Typography variant="body2">Min</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2" sx={{ fontWeight: 600 }}>{eda?.resume_length_stats.min}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2">Max</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2" sx={{ fontWeight: 600 }}>{eda?.resume_length_stats.max}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2">Mean</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2" sx={{ fontWeight: 600 }}>{eda?.resume_length_stats.mean?.toFixed(2)}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2">Median</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2" sx={{ fontWeight: 600 }}>{eda?.resume_length_stats.median?.toFixed(2)}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2">Std</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2" sx={{ fontWeight: 600 }}>{eda?.resume_length_stats.std?.toFixed(2)}</Typography></Grid>
            </Grid>
          </Paper>
        </Grid>
        {/* Main Graphs */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 2, mb: 2, background: isDark ? theme.palette.background.paper : undefined }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>Resume Length Distribution</Typography>
            {histData && <Bar data={histData} />}
          </Paper>
          <Paper elevation={2} sx={{ p: 2, mb: 2, background: isDark ? theme.palette.background.paper : undefined }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>Most Common Curated Skills</Typography>
            {barDataMostCommonSkills && <Bar data={barDataMostCommonSkills} options={{ indexAxis: 'y' }} />}
          </Paper>
        </Grid>
        {/* Accordions for Details */}
        <Grid item xs={12}>
          <Accordion sx={{ mb: 2, background: isDark ? theme.palette.background.paper : undefined }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Skill-Category Heatmap</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {heatmap && (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Category \ Skill</TableCell>
                        {heatmap.skills.map(skill => (
                          <TableCell key={skill}>{skill}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {heatmap.categories.map((cat, i) => (
                        <TableRow key={cat}>
                          <TableCell>{cat}</TableCell>
                          {heatmap.matrix[i].map((count, j) => (
                            <TableCell key={j} sx={{ bgcolor: `rgba(33, 150, 243, ${Math.min(count / Math.max(...heatmap.matrix.flat()), 1)})`, color: count > 0.5 * Math.max(...heatmap.matrix.flat()) ? '#fff' : '#000' }}>{count}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </AccordionDetails>
          </Accordion>
          <Accordion sx={{ mb: 2, background: isDark ? theme.palette.background.paper : undefined }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Top Curated Skills Per Category</Typography>
            </AccordionSummary>
            <AccordionDetails>{renderTopSkillsPerCategory()}</AccordionDetails>
          </Accordion>
          <Accordion sx={{ mb: 2, background: isDark ? theme.palette.background.paper : undefined }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Skill Coverage Per Category</Typography>
            </AccordionSummary>
            <AccordionDetails>{renderSkillCoveragePerCategory()}</AccordionDetails>
          </Accordion>
          <Accordion sx={{ mb: 2, background: isDark ? theme.palette.background.paper : undefined }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Curated Skill-Category Heatmap (% of resumes mentioning each skill)</Typography>
            </AccordionSummary>
            <AccordionDetails>{renderCuratedSkillHeatmap()}</AccordionDetails>
          </Accordion>
          <Accordion sx={{ background: isDark ? theme.palette.background.paper : undefined }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Category-Skill Cross-Tab (Top 5 Curated Skills per Top 5 Categories, with Coverage)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell>Skill</TableCell>
                      <TableCell>Coverage (%)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {eda?.category_skill_crosstab && Object.entries(eda.category_skill_crosstab).map(([cat, skills]) => (
                      skills.map((s, i) => (
                        <TableRow key={cat + s.skill}>
                          <TableCell>{i === 0 ? cat : ''}</TableCell>
                          <TableCell>{s.skill}</TableCell>
                          <TableCell>{(s.coverage * 100).toFixed(1)}</TableCell>
                        </TableRow>
                      ))
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TrainedDatasetDashboardPage; 