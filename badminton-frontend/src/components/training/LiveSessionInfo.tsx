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
    <Card sx={{
      borderLeft: '3px solid #00E5A0',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse at top left, rgba(0,229,160,0.07) 0%, transparent 60%)',
        pointerEvents: 'none',
      },
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <Timer sx={{ fontSize: 18, color: '#00E5A0' }} />
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.01em' }}>
            Live Session
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: '0.7rem', color: '#8B9EC4', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, mb: 0.25 }}>
              Duration
            </Typography>
            <Typography sx={{ fontFamily: '"Bebas Neue", cursive', fontSize: '1.8rem', color: '#EFF2F8', lineHeight: 1, letterSpacing: '0.04em' }}>
              {duration}
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: '0.7rem', color: '#8B9EC4', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, mb: 0.25 }}>
              Total Shots
            </Typography>
            <Typography sx={{ fontFamily: '"Bebas Neue", cursive', fontSize: '1.8rem', color: '#00E5A0', lineHeight: 1, letterSpacing: '0.04em' }}>
              {session.total_shots}
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: '0.7rem', color: '#8B9EC4', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, mb: 0.25 }}>
              On Target
            </Typography>
            <Typography sx={{ fontFamily: '"Bebas Neue", cursive', fontSize: '1.8rem', color: '#F59E0B', lineHeight: 1, letterSpacing: '0.04em' }}>
              {session.successful_shots}
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: '0.7rem', color: '#8B9EC4', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, mb: 0.25 }}>
              Success Rate
            </Typography>
            <Typography sx={{ fontFamily: '"Bebas Neue", cursive', fontSize: '1.8rem', color: '#A78BFA', lineHeight: 1, letterSpacing: '0.04em' }}>
              {successRate}%
            </Typography>
          </Box>
        </Box>

        {templateName && totalPositions !== undefined && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <GpsFixed fontSize="small" sx={{ color: '#A78BFA', fontSize: 15 }} />
              <Typography sx={{ fontSize: '0.78rem', color: '#8B9EC4' }}>
                Template: <span style={{ color: '#EFF2F8', fontWeight: 600 }}>{templateName}</span>
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Chip
                label={`Position ${(currentPositionIndex ?? 0) + 1} / ${totalPositions}`}
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
