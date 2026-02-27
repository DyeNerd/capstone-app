import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Breadcrumbs,
  Link,
} from '@mui/material';
import { ArrowBack, SportsTennis, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { api } from '../utils/api';
import { TrainingSession, TargetTemplate } from '../types';
import CourtVisualization from './CourtVisualization';

const SessionDetail: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [template, setTemplate] = useState<TargetTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedShotIndex, setSelectedShotIndex] = useState(0);

  const loadSession = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const result = await api.getSession(sessionId);
      if (result.success) {
        setSession(result.session);
        // Fetch template info if session uses a template
        if (result.session.template_id) {
          const templateResult = await api.getTemplate(result.session.template_id);
          if (templateResult.success) {
            setTemplate(templateResult.template);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const handlePreviousShot = () => {
    if (selectedShotIndex > 0) {
      setSelectedShotIndex(selectedShotIndex - 1);
    }
  };

  const handleNextShot = () => {
    if (session?.shots && selectedShotIndex < session.shots.length - 1) {
      setSelectedShotIndex(selectedShotIndex + 1);
    }
  };

  const handleShotClick = (index: number) => {
    setSelectedShotIndex(index);
  };

  // Calculate target box for selected shot when using template
  const selectedShot = session?.shots?.[selectedShotIndex];
  const targetBox = useMemo(() => {
    if (!template || selectedShot?.target_position_index === undefined || selectedShot?.target_position_index === null) {
      return undefined;
    }
    const pos = template.positions[selectedShot.target_position_index];
    return pos?.box;
  }, [template, selectedShot?.target_position_index]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!session) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5">Session not found</Typography>
        <Button onClick={() => navigate('/performance')} sx={{ mt: 2 }}>
          Back to Performance
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, margin: '0 auto', padding: 2 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link underline="hover" color="inherit" onClick={() => navigate('/performance')} sx={{ cursor: 'pointer' }}>
          Performance
        </Link>
        <Typography color="text.primary">Session Details</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/performance')}
          sx={{ py: 0.75 }}
        >
          Back
        </Button>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SportsTennis sx={{ color: '#00E5A0', fontSize: 20 }} />
            <Typography sx={{
              fontFamily: '"Bebas Neue", cursive',
              fontSize: { xs: '1.6rem', md: '2rem' },
              letterSpacing: '0.06em',
              color: '#EFF2F8',
              lineHeight: 1,
            }}>
              SESSION DETAILS
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Session Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Athlete
              </Typography>
              <Typography variant="h6">{session.athlete?.athlete_name}</Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Coach
              </Typography>
              <Typography variant="h6">{session.coach?.username}</Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Date & Time
              </Typography>
              <Typography variant="h6">{formatDate(session.start_time)}</Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Duration
              </Typography>
              <Typography variant="h6">{formatDuration(session.start_time, session.end_time)}</Typography>
            </Box>

            <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip label={`Status: ${session.status.toUpperCase()}`} color="success" />
                {session.session_rating && <Chip label={`Rating: ${'⭐'.repeat(session.session_rating)}`} />}
              </Box>

              {session.session_notes && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Notes
                  </Typography>
                  <Typography>{session.session_notes}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Session Statistics
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 3 }}>
            <Box textAlign="center">
              <Typography variant="h5" color="primary">
                {session.total_shots}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Shots
              </Typography>
            </Box>

            <Box textAlign="center">
              <Typography variant="h5" color="success.main">
                {session.successful_shots}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Successful Shots
              </Typography>
            </Box>

            <Box textAlign="center">
              <Typography variant="h5" color="warning.main">
                {session.total_shots > 0
                  ? ((session.successful_shots / session.total_shots) * 100).toFixed(1)
                  : 0}
                %
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Success Rate
              </Typography>
            </Box>

            <Box textAlign="center">
              <Typography variant="h5" color="info.main">
                {session.average_accuracy_percent !== null && session.average_accuracy_percent !== undefined
                  ? `${Number(session.average_accuracy_percent).toFixed(1)}%`
                  : '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Accuracy
              </Typography>
            </Box>

            <Box textAlign="center">
              <Typography variant="h5" color="secondary.main">
                {session.average_shot_velocity_kmh !== null && session.average_shot_velocity_kmh !== undefined
                  ? `${Number(session.average_shot_velocity_kmh).toFixed(1)} km/h`
                  : '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Velocity
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Shot Visualization and Details - Side by Side */}
      {session.shots && session.shots.length > 0 ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
          {/* LEFT: Court Visualization */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SportsTennis />
                  Shot Visualization
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Shot {selectedShotIndex + 1} of {session.shots.length}
                </Typography>
              </Box>

              {/* Coordinate System Indicator */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Chip
                  label={session.template_id ? 'Half-Court (cm)' : 'Full-Court (m)'}
                  size="small"
                  color={session.template_id ? 'primary' : 'default'}
                  variant="outlined"
                />
                {template && (
                  <Chip
                    label={`Template: ${template.name}`}
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                )}
              </Box>

              <CourtVisualization
                mode="review"
                shots={[session.shots[selectedShotIndex]]}
                width={Math.min(500, window.innerWidth - 100)}
                height={session.template_id ? Math.round(Math.min(500, window.innerWidth - 100) * 670 / 610) : 400}
                showLabels={true}
                halfCourt={!!session.template_id}
                targetBox={targetBox}
              />

              {/* Navigation Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<ChevronLeft />}
                  onClick={handlePreviousShot}
                  disabled={selectedShotIndex === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outlined"
                  endIcon={<ChevronRight />}
                  onClick={handleNextShot}
                  disabled={selectedShotIndex === session.shots.length - 1}
                >
                  Next
                </Button>
              </Box>

              {/* Current Shot Details */}
              <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Shot #{session.shots[selectedShotIndex].shot_number} Details
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mt: 1 }}>
                  <Typography variant="body2">
                    <strong>Time:</strong> {new Date(session.shots[selectedShotIndex].timestamp).toLocaleTimeString()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Accuracy:</strong> {Number(session.shots[selectedShotIndex].accuracy_cm).toFixed(1)} cm
                  </Typography>
                  <Typography variant="body2">
                    <strong>Velocity:</strong>{' '}
                    {session.shots[selectedShotIndex].velocity_kmh
                      ? `${Number(session.shots[selectedShotIndex].velocity_kmh).toFixed(1)} km/h`
                      : '-'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Success:</strong> {session.shots[selectedShotIndex].was_successful ? '✅ Yes' : '❌ No'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* RIGHT: Shot Details Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Shot Details
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Click on a row to view shot visualization
              </Typography>

              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 600, mt: 2 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Shot #</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Target (x, y)</TableCell>
                      <TableCell>Landing (x, y)</TableCell>
                      <TableCell align="center">Accuracy</TableCell>
                      <TableCell align="center">Velocity</TableCell>
                      <TableCell align="center">Success</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {session.shots.map((shot, index) => (
                      <TableRow
                        key={shot.id}
                        onClick={() => handleShotClick(index)}
                        selected={index === selectedShotIndex}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                          '&.Mui-selected': {
                            bgcolor: 'primary.light',
                            '&:hover': { bgcolor: 'primary.light' },
                          },
                        }}
                      >
                        <TableCell>
                          <strong>#{shot.shot_number}</strong>
                        </TableCell>
                        <TableCell>{new Date(shot.timestamp).toLocaleTimeString()}</TableCell>
                        <TableCell>
                          {session.template_id
                            ? `(${(Number(shot.target_position_x) * 100).toFixed(0)}cm, ${(Number(shot.target_position_y) * 100).toFixed(0)}cm)`
                            : `(${Number(shot.target_position_x).toFixed(2)}m, ${Number(shot.target_position_y).toFixed(2)}m)`
                          }
                        </TableCell>
                        <TableCell>
                          {session.template_id
                            ? `(${(Number(shot.landing_position_x) * 100).toFixed(0)}cm, ${(Number(shot.landing_position_y) * 100).toFixed(0)}cm)`
                            : `(${Number(shot.landing_position_x).toFixed(2)}m, ${Number(shot.landing_position_y).toFixed(2)}m)`
                          }
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${Number(shot.accuracy_cm).toFixed(1)} cm`}
                            size="small"
                            color={Number(shot.accuracy_cm) < 20 ? 'success' : Number(shot.accuracy_cm) < 50 ? 'warning' : 'error'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {shot.velocity_kmh ? `${Number(shot.velocity_kmh).toFixed(1)} km/h` : '-'}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={shot.was_successful ? 'YES' : 'NO'}
                            size="small"
                            color={shot.was_successful ? 'success' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      ) : (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'rgba(0,0,0,0.15)', borderRadius: 1 }}>
              <Typography color="text.secondary">No shot data available for this session</Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default SessionDetail;

