import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { TrainingProvider } from './context/TrainingContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import Register from './components/Register';
import Navigation from './components/Navigation';
import TrainingControl from './components/TrainingControl';
import PerformanceDashboard from './components/PerformanceDashboard';
import AthleteManagement from './components/AthleteManagement';
import SessionDetail from './components/SessionDetail';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00E5A0',
      dark: '#00C48C',
      light: '#33EBB3',
      contrastText: '#0A0F1C',
    },
    secondary: {
      main: '#F59E0B',
      contrastText: '#0A0F1C',
    },
    background: {
      default: '#0D1526',
      paper: '#141E30',
    },
    text: {
      primary: '#EFF2F8',
      secondary: '#8B9EC4',
    },
    success: {
      main: '#00E5A0',
    },
    error: {
      main: '#F87171',
    },
    warning: {
      main: '#FBBF24',
    },
    info: {
      main: '#60A5FA',
    },
    divider: 'rgba(255,255,255,0.06)',
  },
  typography: {
    fontFamily: '"Outfit", sans-serif',
    h1: { fontFamily: '"Bebas Neue", cursive', letterSpacing: '0.05em' },
    h2: { fontFamily: '"Bebas Neue", cursive', letterSpacing: '0.05em' },
    h3: { fontFamily: '"Bebas Neue", cursive', letterSpacing: '0.04em' },
    h4: { fontFamily: '"Bebas Neue", cursive', letterSpacing: '0.04em', fontWeight: 400 },
    h5: { fontFamily: '"Bebas Neue", cursive', letterSpacing: '0.04em' },
    h6: { fontFamily: '"Outfit", sans-serif', fontWeight: 700, letterSpacing: '0.01em' },
    button: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0D1526',
          backgroundImage: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#141E30',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
          transition: 'border-color 0.2s ease',
          '&:hover': {
            borderColor: 'rgba(0,229,160,0.14)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          letterSpacing: '0.02em',
          borderRadius: 6,
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #00E5A0 0%, #00C48C 100%)',
          color: '#0A0F1C',
          fontWeight: 700,
          boxShadow: '0 0 20px rgba(0,229,160,0.25)',
          '&:hover': {
            background: 'linear-gradient(135deg, #33EBB3 0%, #00D49C 100%)',
            boxShadow: '0 0 30px rgba(0,229,160,0.45)',
          },
        },
        containedError: {
          background: '#EF4444',
          boxShadow: 'none',
          '&:hover': {
            background: '#DC2626',
            boxShadow: '0 0 20px rgba(239,68,68,0.3)',
          },
        },
        outlinedPrimary: {
          borderColor: 'rgba(0,229,160,0.5)',
          color: '#00E5A0',
          '&:hover': {
            backgroundColor: 'rgba(0,229,160,0.08)',
            borderColor: '#00E5A0',
          },
        },
        outlinedError: {
          borderColor: 'rgba(248,113,113,0.5)',
          color: '#F87171',
          '&:hover': {
            backgroundColor: 'rgba(248,113,113,0.08)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#0A0F1C',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255,255,255,0.03)',
            '& fieldset': {
              borderColor: 'rgba(255,255,255,0.1)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0,229,160,0.4)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00E5A0',
            },
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#00E5A0',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.03)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#141E30',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: 'rgba(255,255,255,0.03)',
            color: '#8B9EC4',
            fontWeight: 600,
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&.MuiTableRow-hover:hover': {
            backgroundColor: 'rgba(0,229,160,0.04)',
          },
          '& .MuiTableCell-body': {
            borderColor: 'rgba(255,255,255,0.04)',
            fontSize: '0.875rem',
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'transparent',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.68rem',
          letterSpacing: '0.06em',
        },
        colorSuccess: {
          backgroundColor: 'rgba(0,229,160,0.12)',
          color: '#00E5A0',
          border: '1px solid rgba(0,229,160,0.3)',
        },
        colorError: {
          backgroundColor: 'rgba(248,113,113,0.12)',
          color: '#F87171',
          border: '1px solid rgba(248,113,113,0.3)',
        },
        colorPrimary: {
          backgroundColor: 'rgba(96,165,250,0.12)',
          color: '#60A5FA',
          border: '1px solid rgba(96,165,250,0.3)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
        filledError: {
          backgroundColor: 'rgba(248,113,113,0.15)',
          border: '1px solid rgba(248,113,113,0.3)',
          color: '#F87171',
        },
        standardError: {
          backgroundColor: 'rgba(248,113,113,0.1)',
          border: '1px solid rgba(248,113,113,0.25)',
          color: '#FCA5A5',
          '& .MuiAlert-icon': {
            color: '#F87171',
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255,255,255,0.06)',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: '#1A2640',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          '&:hover': {
            backgroundColor: 'rgba(0,229,160,0.06)',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#8B9EC4',
          '&.Mui-focused': {
            color: '#00E5A0',
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.08)',
          borderRadius: 4,
        },
      },
    },
    MuiRating: {
      styleOverrides: {
        iconFilled: {
          color: '#F59E0B',
        },
        iconEmpty: {
          color: 'rgba(255,255,255,0.2)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <TrainingProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Box>
                      <Navigation />
                      <TrainingControl />
                    </Box>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/performance"
                element={
                  <ProtectedRoute>
                    <Box>
                      <Navigation />
                      <PerformanceDashboard />
                    </Box>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/athletes"
                element={
                  <ProtectedRoute>
                    <Box>
                      <Navigation />
                      <AthleteManagement />
                    </Box>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/session/:sessionId"
                element={
                  <ProtectedRoute>
                    <Box>
                      <Navigation />
                      <SessionDetail />
                    </Box>
                  </ProtectedRoute>
                }
              />

              {/* Redirect any unknown routes to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </TrainingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
