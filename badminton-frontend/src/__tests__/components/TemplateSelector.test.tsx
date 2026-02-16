import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TemplateSelector from '../../components/training/TemplateSelector';
import { TargetTemplate } from '../../types';

// Mock template data
const mockTemplates: TargetTemplate[] = [
  {
    id: 'template-001',
    name: 'template-001',
    description: 'first template',
    positions: [
      { positionIndex: 0, box: { x1: 46, y1: 594, x2: 122, y2: 670 }, dot: { x: 46, y: 670 } },
      { positionIndex: 1, box: { x1: 488, y1: 198, x2: 564, y2: 274 }, dot: { x: 526, y: 236 } },
      { positionIndex: 2, box: { x1: 488, y1: 0, x2: 564, y2: 76 }, dot: { x: 526, y: 38 } },
    ],
  },
  {
    id: 'template-002',
    name: 'template-002',
    description: 'second template',
    positions: [
      { positionIndex: 0, box: { x1: 0, y1: 0, x2: 100, y2: 100 }, dot: { x: 50, y: 50 } },
      { positionIndex: 1, box: { x1: 200, y1: 200, x2: 300, y2: 300 }, dot: { x: 250, y: 250 } },
    ],
  },
];

describe('TemplateSelector Component', () => {
  const mockOnTemplateChange = jest.fn();

  beforeEach(() => {
    mockOnTemplateChange.mockClear();
  });

  describe('rendering', () => {
    it('should render the component with title', () => {
      render(
        <TemplateSelector
          templates={mockTemplates}
          selectedTemplate={null}
          isTrainingActive={false}
          onTemplateChange={mockOnTemplateChange}
        />
      );

      expect(screen.getByText('Target Template')).toBeInTheDocument();
    });

    it('should render warning when no template selected', () => {
      render(
        <TemplateSelector
          templates={mockTemplates}
          selectedTemplate={null}
          isTrainingActive={false}
          onTemplateChange={mockOnTemplateChange}
        />
      );

      expect(
        screen.getByText('Please select a target template before starting training')
      ).toBeInTheDocument();
    });

    it('should render error when no templates available', () => {
      render(
        <TemplateSelector
          templates={[]}
          selectedTemplate={null}
          isTrainingActive={false}
          onTemplateChange={mockOnTemplateChange}
        />
      );

      expect(screen.getByText('No templates available. Contact administrator.')).toBeInTheDocument();
    });

    it('should render success message when template is selected', () => {
      render(
        <TemplateSelector
          templates={mockTemplates}
          selectedTemplate={mockTemplates[0]}
          isTrainingActive={false}
          onTemplateChange={mockOnTemplateChange}
        />
      );

      // Template name appears in multiple places (dropdown value, alert)
      const templateNames = screen.getAllByText('template-001');
      expect(templateNames.length).toBeGreaterThan(0);
      // Description in alert
      const descriptions = screen.getAllByText(/first template/);
      expect(descriptions.length).toBeGreaterThan(0);
      expect(screen.getByText(/3 target positions/)).toBeInTheDocument();
    });

    it('should render court preview when template is selected', () => {
      render(
        <TemplateSelector
          templates={mockTemplates}
          selectedTemplate={mockTemplates[0]}
          isTrainingActive={false}
          onTemplateChange={mockOnTemplateChange}
        />
      );

      // Check for SVG court preview (NET label)
      expect(screen.getByText('NET')).toBeInTheDocument();
    });

    it('should render position numbers in court preview', () => {
      render(
        <TemplateSelector
          templates={mockTemplates}
          selectedTemplate={mockTemplates[0]}
          isTrainingActive={false}
          onTemplateChange={mockOnTemplateChange}
        />
      );

      // Position labels (1, 2, 3 for 3 positions)
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should disable select when training is active', () => {
      render(
        <TemplateSelector
          templates={mockTemplates}
          selectedTemplate={mockTemplates[0]}
          isTrainingActive={true}
          onTemplateChange={mockOnTemplateChange}
        />
      );

      // MUI Select renders with a specific structure - look for disabled state
      const selectElement = screen.getByRole('combobox');
      expect(selectElement).toHaveAttribute('aria-disabled', 'true');
    });

    it('should enable select when training is not active', () => {
      render(
        <TemplateSelector
          templates={mockTemplates}
          selectedTemplate={null}
          isTrainingActive={false}
          onTemplateChange={mockOnTemplateChange}
        />
      );

      const selectElement = screen.getByRole('combobox');
      expect(selectElement).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('should call onTemplateChange when selection changes', async () => {
      render(
        <TemplateSelector
          templates={mockTemplates}
          selectedTemplate={null}
          isTrainingActive={false}
          onTemplateChange={mockOnTemplateChange}
        />
      );

      // Open the select dropdown
      const selectElement = screen.getByRole('combobox');
      fireEvent.mouseDown(selectElement);

      // Select the first option
      const option = await screen.findByText('template-001');
      fireEvent.click(option);

      expect(mockOnTemplateChange).toHaveBeenCalledWith('template-001');
    });
  });

  describe('template data display', () => {
    it('should display template description', () => {
      render(
        <TemplateSelector
          templates={mockTemplates}
          selectedTemplate={mockTemplates[0]}
          isTrainingActive={false}
          onTemplateChange={mockOnTemplateChange}
        />
      );

      // Description appears in Alert - may appear multiple times
      const descriptions = screen.getAllByText(/first template/);
      expect(descriptions.length).toBeGreaterThan(0);
    });

    it('should display cycling info', () => {
      render(
        <TemplateSelector
          templates={mockTemplates}
          selectedTemplate={mockTemplates[0]}
          isTrainingActive={false}
          onTemplateChange={mockOnTemplateChange}
        />
      );

      expect(screen.getByText(/Shots cycle: 1→2→3→1→2→3.../)).toBeInTheDocument();
    });

    it('should handle template with different position count', () => {
      render(
        <TemplateSelector
          templates={mockTemplates}
          selectedTemplate={mockTemplates[1]}
          isTrainingActive={false}
          onTemplateChange={mockOnTemplateChange}
        />
      );

      expect(screen.getByText(/2 target positions/)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have required attribute on select', () => {
      render(
        <TemplateSelector
          templates={mockTemplates}
          selectedTemplate={null}
          isTrainingActive={false}
          onTemplateChange={mockOnTemplateChange}
        />
      );

      // Check for required indicator
      expect(screen.getByText('Select Template *')).toBeInTheDocument();
    });
  });
});
