import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Divider,
} from '@mui/material';
import { Visibility, TrendingUp, AccessTime, FitnessCenter, Speed, Adjust } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTraining } from '../context/TrainingContext';
import { api } from '../utils/api';
import { TrainingSession } from '../types';

interface StatCardProps {
  value: string;
  label: string;
  accentColor: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, accentColor, icon }) => (
  <Card sx={{
    borderLeft: `3px solid ${accentColor}`,
    borderRadius: '6px',
    background: '#141E30',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `radial-gradient(ellipse at top left, ${accentColor}0D 0%, transparent 60%)`,
      pointerEvents: 'none',
    },
  }}>
    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography sx={{
            fontFamily: '"Bebas Neue", cursive',
            fontSize: '2.6rem',
            color: accentColor,
            lineHeight: 1,
            letterSpacing: '0.02em',
          }}>
            {value}
          </Typography>
          <Typography sx={{
            fontSize: '0.72rem',
            color: '#8B9EC4',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 600,
            mt: 0.5,
          }}>
            {label}
          </Typography>
        </Box>
        <Box sx={{
          color: accentColor,
          opacity: 0.4,
          mt: 0.5,
        }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const PerformanceDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { athletes, loadAthletes } = useTraining();
  const [selectedAthleteId, setSelectedAthleteId] = useState('');
  const [sessions, setSessions] = useState<TrainingSession[]>([]);

  const loadSessions = useCallback(async (athleteId: string) => {
    try {
      const result = await api.getSessions({ athleteId });
      if (result.success) {
        setSessions(result.sessions);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  }, []);

  useEffect(() => {
    loadAthletes();
  }, [loadAthletes]);

  useEffect(() => {
    if (athletes.length > 0 && !selectedAthleteId) {
      setSelectedAthleteId(athletes[0].id);
    }
  }, [athletes, selectedAthleteId]);

  useEffect(() => {
    if (selectedAthleteId) {
      loadSessions(selectedAthleteId);
    }
  }, [selectedAthleteId, loadSessions]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'active': return 'primary';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' · '
      + date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const calculateStats = () => {
    const completedSessions = sessions.filter((s) => s.status === 'completed');
    if (completedSessions.length === 0) return null;

    const totalShots = completedSessions.reduce((sum, s) => sum + (s.total_shots || 0), 0);

    const sessionsWithAccuracy = completedSessions.filter(
      (s) => s.average_accuracy_percent !== null && s.average_accuracy_percent !== undefined
    );
    const avgAccuracy = sessionsWithAccuracy.length > 0
      ? sessionsWithAccuracy.reduce((sum, s) => sum + Number(s.average_accuracy_percent), 0) / sessionsWithAccuracy.length
      : 0;

    const sessionsWithVelocity = completedSessions.filter(
      (s) => s.average_shot_velocity_kmh !== null && s.average_shot_velocity_kmh !== undefined
    );
    const avgVelocity = sessionsWithVelocity.length > 0
      ? sessionsWithVelocity.reduce((sum, s) => sum + Number(s.average_shot_velocity_kmh), 0) / sessionsWithVelocity.length
      : 0;

    const sessionsWithScore = completedSessions.filter(
      (s) => s.average_score !== null && s.average_score !== undefined
    );
    const avgScore = sessionsWithScore.length > 0
      ? sessionsWithScore.reduce((sum, s) => sum + Number(s.average_score), 0) / sessionsWithScore.length
      : 0;

    return { totalSessions: completedSessions.length, totalShots, avgAccuracy, avgVelocity, avgScore };
  };

  const stats = calculateStats();
  const selectedAthlete = athletes.find((a) => a.id === selectedAthleteId);

  return (
    <Box sx={{ maxWidth: 1400, margin: '0 auto', padding: { xs: 2, md: 3 } }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <TrendingUp sx={{ color: '#00E5A0', fontSize: 22 }} />
          <Typography sx={{
            fontFamily: '"Bebas Neue", cursive',
            fontSize: { xs: '1.8rem', md: '2.2rem' },
            letterSpacing: '0.06em',
            color: '#EFF2F8',
            lineHeight: 1,
          }}>
            PERFORMANCE DASHBOARD
          </Typography>
        </Box>
        <Typography sx={{ color: '#8B9EC4', fontSize: '0.85rem', ml: 4 }}>
          Analyze athlete performance across training sessions
        </Typography>
      </Box>

      {/* Athlete Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '0.8rem', color: '#8B9EC4', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Athlete
            </Typography>
            <FormControl sx={{ minWidth: 280 }} size="small">
              <InputLabel>Select Athlete</InputLabel>
              <Select value={selectedAthleteId} onChange={(e) => setSelectedAthleteId(e.target.value)}>
                {athletes.map((athlete) => (
                  <MenuItem key={athlete.id} value={athlete.id}>
                    {athlete.athlete_name}
                    <Typography component="span" sx={{ ml: 1, fontSize: '0.75rem', color: '#8B9EC4' }}>
                      ({athlete.skill_level})
                    </Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      {stats && (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
          gap: 2,
          mb: 3,
        }}>
          <StatCard
            value={String(stats.totalSessions)}
            label="Total Sessions"
            accentColor="#60A5FA"
            icon={<FitnessCenter />}
          />
          <StatCard
            value={String(stats.totalShots)}
            label="Total Shots"
            accentColor="#00E5A0"
            icon={<Adjust />}
          />
          <StatCard
            value={`${isNaN(stats.avgAccuracy) ? '0.0' : stats.avgAccuracy.toFixed(1)}%`}
            label="Avg Accuracy"
            accentColor="#F59E0B"
            icon={<TrendingUp />}
          />
          <StatCard
            value={`${isNaN(stats.avgVelocity) ? '0.0' : stats.avgVelocity.toFixed(1)}`}
            label="Avg Velocity km/h"
            accentColor="#A78BFA"
            icon={<Speed />}
          />
          <StatCard
            value={`${isNaN(stats.avgScore) ? '0.0' : stats.avgScore.toFixed(1)}`}
            label="Avg Score"
            accentColor="#60A5FA"
            icon={<TrendingUp />}
          />
        </Box>
      )}

      {/* Training History */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AccessTime sx={{ color: '#8B9EC4', fontSize: 18 }} />
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.02em' }}>
              Training History
            </Typography>
            {selectedAthlete && (
              <Chip
                label={selectedAthlete.athlete_name}
                size="small"
                sx={{ ml: 0.5, fontSize: '0.72rem', height: 22 }}
              />
            )}
          </Box>
          <Divider />

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Coach</TableCell>
                  <TableCell align="center">Shots</TableCell>
                  <TableCell align="center">Accuracy</TableCell>
                  <TableCell align="center">Score</TableCell>
                  <TableCell align="center">Velocity</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Rating</TableCell>
                  <TableCell align="center">View</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow
                    key={session.id}
                    hover
                    onClick={() => navigate(`/session/${session.id}`)}
                  >
                    <TableCell sx={{ color: '#EFF2F8', whiteSpace: 'nowrap' }}>
                      {formatDate(session.start_time)}
                    </TableCell>
                    <TableCell sx={{ color: '#8B9EC4' }}>
                      {session.coach?.username || 'N/A'}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, color: '#00E5A0' }}>
                      {session.total_shots || 0}
                    </TableCell>
                    <TableCell align="center">
                      {session.average_accuracy_percent !== null && session.average_accuracy_percent !== undefined ? (
                        <Typography sx={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: Number(session.average_accuracy_percent) >= 70
                            ? '#00E5A0'
                            : Number(session.average_accuracy_percent) >= 40
                              ? '#FBBF24'
                              : '#F87171',
                        }}>
                          {Number(session.average_accuracy_percent).toFixed(1)}%
                        </Typography>
                      ) : (
                        <Typography sx={{ color: '#4B5563', fontSize: '0.875rem' }}>—</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {session.average_score !== null && session.average_score !== undefined ? (
                        <Typography sx={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: Number(session.average_score) >= 90
                            ? '#00E5A0'
                            : Number(session.average_score) >= 75
                              ? '#FBBF24'
                              : '#F87171',
                        }}>
                          {Number(session.average_score).toFixed(1)}
                        </Typography>
                      ) : (
                        <Typography sx={{ color: '#4B5563', fontSize: '0.875rem' }}>—</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ color: '#8B9EC4', fontSize: '0.875rem' }}>
                      {session.average_shot_velocity_kmh !== null && session.average_shot_velocity_kmh !== undefined
                        ? `${Number(session.average_shot_velocity_kmh).toFixed(1)} km/h`
                        : <Typography sx={{ color: '#4B5563', fontSize: '0.875rem' }}>—</Typography>}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={session.status.toUpperCase()}
                        color={getStatusColor(session.status) as 'success' | 'error' | 'primary' | 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {session.session_rating ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          <Typography sx={{ color: '#F59E0B', fontSize: '0.875rem' }}>★</Typography>
                          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{session.session_rating}</Typography>
                        </Box>
                      ) : (
                        <Typography sx={{ color: '#4B5563', fontSize: '0.875rem' }}>—</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        startIcon={<Visibility fontSize="small" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/session/${session.id}`);
                        }}
                        sx={{ fontSize: '0.78rem', py: 0.5, px: 1.5 }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {sessions.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography sx={{ color: '#4B5563', fontSize: '0.875rem' }}>
                No training sessions found for {selectedAthlete?.athlete_name || 'selected athlete'}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PerformanceDashboard;
