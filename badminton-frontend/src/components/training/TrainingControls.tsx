import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Alert,
} from '@mui/material';
import { PlayArrow, Stop, SportsTennis } from '@mui/icons-material';
import { Athlete, TrainingSession, TargetTemplate } from '../../types';

interface TrainingControlsProps {
  selectedAthlete: Athlete | null;
  selectedTemplate: TargetTemplate | null;
  currentSession: TrainingSession | null;
  isTrainingActive: boolean;
  onStartTraining: () => Promise<void>;
  onStopTraining: () => Promise<void>;
}

/**
 * EXTRACTED COMPONENT: Training Controls
 *
 * Responsibilities:
 * - Start/stop buttons
 * - Session ID display for mock CV
 * - Error handling
 *
 * Optimization: Memoized with error state managed locally
 */
const TrainingControls: React.FC<TrainingControlsProps> = ({
  selectedAthlete,
  selectedTemplate,
  currentSession,
  isTrainingActive,
  onStartTraining,
  onStopTraining,
}) => {
  const [error, setError] = useState('');

  const handleStart = async () => {
    if (!selectedAthlete) {
      setError('Please select an athlete first!');
      return;
    }
    if (!selectedTemplate) {
      setError('Please select a template first!');
      return;
    }
    try {
      setError('');
      await onStartTraining();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start training';
      setError(errorMessage);
    }
  };

  const handleStop = async () => {
    try {
      setError('');
      await onStopTraining();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop training';
      setError(errorMessage);
    }
  };

  const handleCopySessionId = (sessionId: string) => {
    navigator.clipboard.writeText(sessionId);
    alert('Session ID copied to clipboard!');
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <SportsTennis />
          <Typography variant="h6">Training Session</Typography>
          {isTrainingActive && (
            <Chip label="TRAINING ACTIVE" color="success" variant="filled" sx={{ fontWeight: 'bold' }} />
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Session ID for Mock CV Script */}
        {isTrainingActive && currentSession && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="caption" display="block" gutterBottom>
              <strong>📋 Session ID (copy this for mock CV script):</strong>
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                wordBreak: 'break-all',
                userSelect: 'all',
                cursor: 'pointer',
                bgcolor: 'rgba(0,0,0,0.05)',
                p: 1,
                borderRadius: 1,
                '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' },
              }}
              onClick={() => handleCopySessionId(currentSession.id)}
            >
              {currentSession.id}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              💡 Click to copy • Run: <code>python3 mock_cv_component.py {currentSession.id}</code>
            </Typography>
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
          <Button
            variant="contained"
            color="success"
            size="large"
            fullWidth
            startIcon={<PlayArrow />}
            onClick={handleStart}
            disabled={!selectedAthlete || !selectedTemplate || isTrainingActive}
            sx={{ py: 2, fontSize: '1.1rem' }}
          >
            START TRAINING
          </Button>

          <Button
            variant="contained"
            color="error"
            size="large"
            fullWidth
            startIcon={<Stop />}
            onClick={handleStop}
            disabled={!isTrainingActive}
            sx={{ py: 2, fontSize: '1.1rem' }}
          >
            STOP TRAINING
          </Button>
        </Box>

        {!selectedAthlete && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Please select an athlete before starting training
          </Alert>
        )}

        {selectedAthlete && !selectedTemplate && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Please select a target template before starting training
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(TrainingControls);
