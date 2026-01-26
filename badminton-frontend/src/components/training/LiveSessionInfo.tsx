import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { Timer, CheckCircle, Cancel, GpsFixed } from '@mui/icons-material';

interface LiveSessionInfoProps {
  session: {
    start_time: string;
    total_shots: number;
    successful_shots: number;
  };
  templateName?: string;
  currentPositionIndex?: number;
  totalPositions?: number;
  lastShotInBox?: boolean;
}

/**
 * EXTRACTED COMPONENT: Live Session Info
 *
 * Responsibilities:
 * - Display session duration (updates every minute)
 * - Show shot statistics
 *
 * Optimization: Memoized, auto-updating duration
 */
const LiveSessionInfo: React.FC<LiveSessionInfoProps> = ({
  session,
  templateName,
  currentPositionIndex,
  totalPositions,
  lastShotInBox,
}) => {
  const [, setTick] = useState(0);

  // Update duration every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 60000); // Update every 60 seconds

    return () => clearInterval(interval);
  }, []);

  // OPTIMIZATION: Memoize duration calculation
  const duration = useMemo(() => {
    const start = new Date(session.start_time);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }, [session.start_time]);

  // OPTIMIZATION: Memoize success rate calculation
  const successRate = useMemo(() => {
    if (session.total_shots === 0) return 0;
    return ((session.successful_shots / session.total_shots) * 100).toFixed(1);
  }, [session.total_shots, session.successful_shots]);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Timer />
          <Typography variant="h6">Session Info</Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Duration
            </Typography>
            <Typography variant="h6">{duration}</Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              Total Shots
            </Typography>
            <Typography variant="h6">{session.total_shots}</Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              Successful Shots
            </Typography>
            <Typography variant="h6">{session.successful_shots}</Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              Success Rate
            </Typography>
            <Typography variant="h6">{successRate}%</Typography>
          </Box>
        </Box>

        {/* Template Position Info */}
        {templateName && totalPositions !== undefined && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <GpsFixed fontSize="small" color="primary" />
              <Typography variant="body2" color="text.secondary">
                Template: <strong>{templateName}</strong>
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={`Position ${(currentPositionIndex ?? 0) + 1} of ${totalPositions}`}
                color="primary"
                variant="outlined"
                size="small"
              />
              {lastShotInBox !== undefined && (
                <Chip
                  icon={lastShotInBox ? <CheckCircle /> : <Cancel />}
                  label={lastShotInBox ? 'In Box' : 'Outside'}
                  color={lastShotInBox ? 'success' : 'error'}
                  size="small"
                />
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(LiveSessionInfo);
