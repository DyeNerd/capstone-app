import React, { useMemo } from 'react';
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

interface TemplateSelectorProps {
  templates: TargetTemplate[];
  selectedTemplate: TargetTemplate | null;
  isTrainingActive: boolean;
  onTemplateChange: (templateId: string) => void;
}

// Half-court dimensions in cm
const COURT_WIDTH = 610;
const COURT_HEIGHT = 670;

/**
 * Mini-court preview showing all target positions
 */
const CourtPreview: React.FC<{ template: TargetTemplate }> = React.memo(({ template }) => {
  // Court lines for half-court visualization
  const courtLines = useMemo(() => (
    <>
      {/* Court boundary */}
      <rect
        x={0}
        y={0}
        width={COURT_WIDTH}
        height={COURT_HEIGHT}
        fill="#2d5a27"
        stroke="#fff"
        strokeWidth={4}
      />
      {/* Net line (top) */}
      <line x1={0} y1={0} x2={COURT_WIDTH} y2={0} stroke="#fff" strokeWidth={6} />
      {/* Service line */}
      <line x1={0} y1={198} x2={COURT_WIDTH} y2={198} stroke="#fff" strokeWidth={2} />
      {/* Center line */}
      <line x1={COURT_WIDTH / 2} y1={0} x2={COURT_WIDTH / 2} y2={198} stroke="#fff" strokeWidth={2} />
      {/* Back doubles service line */}
      <line x1={0} y1={76} x2={COURT_WIDTH} y2={76} stroke="#fff" strokeWidth={2} />
    </>
  ), []);

  return (
    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
      <svg
        viewBox={`0 0 ${COURT_WIDTH} ${COURT_HEIGHT}`}
        width="100%"
        height="200"
        style={{ maxWidth: '300px', border: '2px solid #333', borderRadius: '4px' }}
      >
        {courtLines}

        {/* Render all target positions */}
        {template.positions.map((pos) => (
          <g key={pos.positionIndex}>
            {/* Target box - semi-transparent */}
            <rect
              x={pos.box.x1}
              y={pos.box.y1}
              width={pos.box.x2 - pos.box.x1}
              height={pos.box.y2 - pos.box.y1}
              fill="rgba(255, 235, 59, 0.4)"
              stroke="#ffc107"
              strokeWidth={3}
            />
            {/* Target dot */}
            <circle
              cx={pos.dot.x}
              cy={pos.dot.y}
              r={12}
              fill="#f44336"
              stroke="#fff"
              strokeWidth={2}
            />
            {/* Position label */}
            <text
              x={(pos.box.x1 + pos.box.x2) / 2}
              y={(pos.box.y1 + pos.box.y2) / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#000"
              fontSize="28"
              fontWeight="bold"
            >
              {pos.positionIndex + 1}
            </text>
          </g>
        ))}

        {/* Net label */}
        <text x={COURT_WIDTH / 2} y={20} textAnchor="middle" fill="#fff" fontSize="24" fontWeight="bold">
          NET
        </text>
      </svg>
    </Box>
  );
});

CourtPreview.displayName = 'CourtPreview';

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
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <GridOn />
          <Typography variant="h6">Target Template</Typography>
        </Box>

        <FormControl fullWidth>
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
            <CourtPreview template={selectedTemplate} />
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
