import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Alert,
} from '@mui/material';
import { PersonAdd, Edit, Delete } from '@mui/icons-material';
import { useTraining } from '../context/TrainingContext';
import { Athlete } from '../types';

const AthleteManagement: React.FC = () => {
  const { athletes, loadAthletes, createAthlete, updateAthlete, deleteAthlete } = useTraining();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  const [athleteToDelete, setAthleteToDelete] = useState<Athlete | null>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    athlete_name: '',
    date_of_birth: '',
    gender: '',
    skill_level: 'beginner' as any,
    height_cm: '',
    dominant_hand: '',
    notes: '',
  });

  useEffect(() => {
    loadAthletes();
  }, [loadAthletes]);

  const handleOpenDialog = (athlete?: Athlete) => {
    if (athlete) {
      setEditingAthlete(athlete);
      setFormData({
        athlete_name: athlete.athlete_name,
        date_of_birth: athlete.date_of_birth || '',
        gender: athlete.gender || '',
        skill_level: athlete.skill_level,
        height_cm: athlete.height_cm?.toString() || '',
        dominant_hand: athlete.dominant_hand || '',
        notes: athlete.notes || '',
      });
    } else {
      setEditingAthlete(null);
      setFormData({
        athlete_name: '',
        date_of_birth: '',
        gender: '',
        skill_level: 'beginner',
        height_cm: '',
        dominant_hand: '',
        notes: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAthlete(null);
    setError('');
  };

  const handleSaveAthlete = async () => {
    try {
      setError('');
      const data = {
        ...formData,
        height_cm: formData.height_cm ? parseFloat(formData.height_cm) : undefined,
      };

      if (editingAthlete) {
        await updateAthlete(editingAthlete.id, data);
      } else {
        await createAthlete(data);
      }

      handleCloseDialog();
    } catch (err: any) {
      setError(err.message || 'Failed to save athlete');
    }
  };

  const handleDeleteAthlete = async () => {
    if (!athleteToDelete) return;

    try {
      await deleteAthlete(athleteToDelete.id);
      setDeleteDialogOpen(false);
      setAthleteToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete athlete');
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <PersonAdd sx={{ color: '#60A5FA', fontSize: 22 }} />
            <Typography sx={{
              fontFamily: '"Bebas Neue", cursive',
              fontSize: { xs: '1.8rem', md: '2.2rem' },
              letterSpacing: '0.06em',
              color: '#EFF2F8',
              lineHeight: 1,
            }}>
              ATHLETE MANAGEMENT
            </Typography>
          </Box>
          <Typography sx={{ color: '#8B9EC4', fontSize: '0.85rem', ml: 4 }}>
            Manage your team of athletes
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => handleOpenDialog()}
          sx={{
            fontFamily: '"Bebas Neue", cursive',
            fontSize: '0.95rem',
            letterSpacing: '0.08em',
            px: 2.5,
            py: 1.25,
          }}
        >
          NEW ATHLETE
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        {athletes.map((athlete) => (
          <Box key={athlete.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" noWrap>
                    {athlete.athlete_name}
                  </Typography>
                  <Box>
                    <IconButton size="small" onClick={() => handleOpenDialog(athlete)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        setAthleteToDelete(athlete);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={athlete.skill_level}
                    size="small"
                    color={
                      athlete.skill_level === 'beginner'
                        ? 'default'
                        : athlete.skill_level === 'intermediate'
                        ? 'primary'
                        : 'success'
                    }
                  />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {athlete.date_of_birth && (
                    <Typography variant="body2" color="text.secondary">
                      Age: {calculateAge(athlete.date_of_birth)} years
                    </Typography>
                  )}
                  {athlete.gender && (
                    <Typography variant="body2" color="text.secondary">
                      Gender: {athlete.gender}
                    </Typography>
                  )}
                  {athlete.height_cm && (
                    <Typography variant="body2" color="text.secondary">
                      Height: {athlete.height_cm} cm
                    </Typography>
                  )}
                  {athlete.dominant_hand && (
                    <Typography variant="body2" color="text.secondary">
                      Dominant: {athlete.dominant_hand}
                    </Typography>
                  )}
                </Box>

                {athlete.notes && (
                  <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
                    {athlete.notes.substring(0, 100)}
                    {athlete.notes.length > 100 && '...'}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        ))}

        {athletes.length === 0 && (
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No athletes found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Create your first athlete to get started
                </Typography>
                <Button variant="contained" startIcon={<PersonAdd />} onClick={() => handleOpenDialog()}>
                  Create First Athlete
                </Button>
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingAthlete ? 'Edit Athlete' : 'Create New Athlete'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Athlete Name *"
            value={formData.athlete_name}
            onChange={(e) => setFormData({ ...formData, athlete_name: e.target.value })}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Date of Birth"
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Gender</InputLabel>
            <Select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              <MenuItem value="">None</MenuItem>
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Skill Level *</InputLabel>
            <Select
              value={formData.skill_level}
              onChange={(e) => setFormData({ ...formData, skill_level: e.target.value as any })}
            >
              <MenuItem value="beginner">Beginner</MenuItem>
              <MenuItem value="intermediate">Intermediate</MenuItem>
              <MenuItem value="advanced">Advanced</MenuItem>
              <MenuItem value="professional">Professional</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Height (cm)"
            type="number"
            value={formData.height_cm}
            onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
            margin="normal"
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Dominant Hand</InputLabel>
            <Select
              value={formData.dominant_hand}
              onChange={(e) => setFormData({ ...formData, dominant_hand: e.target.value })}
            >
              <MenuItem value="">None</MenuItem>
              <MenuItem value="left">Left</MenuItem>
              <MenuItem value="right">Right</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveAthlete} variant="contained">
            {editingAthlete ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Athlete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{athleteToDelete?.athlete_name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This action cannot be undone. All training history will be preserved.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteAthlete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AthleteManagement;

