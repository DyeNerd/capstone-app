import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Alert,
} from '@mui/material';
import { GridOn } from '@mui/icons-material';
import { TargetTemplate } from '../../types';
import CourtVisualization from '../CourtVisualization';

interface TemplateSelectorProps {
  templates: TargetTemplate[];
  selectedTemplate: TargetTemplate | null;
  isTrainingActive: boolean;
  onTemplateChange: (templateId: string) => void;
}

/**
 * Template Selector Component
 *
 * Allows coaches to select a preset target template before starting training.
 * Shows a mini-court preview with all target positions.
 */
const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  selectedTemplate,
  isTrainingActive,
  onTemplateChange,
}) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <GridOn sx={{ fontSize: 18, color: '#A78BFA' }} />
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.01em' }}>
            Target Template
          </Typography>
        </Box>

        <FormControl fullWidth size="small">
          <InputLabel>Select Template *</InputLabel>
          <Select
            value={selectedTemplate?.id || ''}
            onChange={(e) => onTemplateChange(e.target.value)}
            disabled={isTrainingActive}
            required
          >
            {templates.map((template) => (
              <MenuItem key={template.id} value={template.id}>
                <Box>
                  <Typography variant="body1">{template.name}</Typography>
                  {template.description && (
                    <Typography variant="caption" color="text.secondary">
                      {template.description} • {template.positions.length} positions
                    </Typography>
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Preview selected template */}
        {selectedTemplate && (
          <>
            <Alert severity="success" sx={{ mt: 2 }}>
              <strong>{selectedTemplate.name}</strong>
              {selectedTemplate.description && ` - ${selectedTemplate.description}`}
              <br />
              <Typography variant="caption">
                {selectedTemplate.positions.length} target positions • Shots cycle: 1→2→3→1→2→3...
              </Typography>
            </Alert>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <CourtVisualization
                mode="preview"
                width={360}
                height={396}
                halfCourt={true}
                templatePositions={selectedTemplate.positions}
              />
            </Box>
          </>
        )}

        {!selectedTemplate && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Please select a target template before starting training
          </Alert>
        )}

        {templates.length === 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            No templates available. Contact administrator.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(TemplateSelector);
