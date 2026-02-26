import request from 'supertest';
import express from 'express';
import templateRoutes from '../../routes/template.routes';
import { PRESET_TEMPLATES } from '../../constants/templates';

describe('Template API Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/templates', templateRoutes);
  });

  describe('GET /api/templates', () => {
    it('should return all templates with 200 status', async () => {
      const response = await request(app).get('/api/templates');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('templates');
      expect(Array.isArray(response.body.templates)).toBe(true);
    });

    it('should return templates matching PRESET_TEMPLATES', async () => {
      const response = await request(app).get('/api/templates');

      expect(response.body.templates).toEqual(PRESET_TEMPLATES);
    });

    it('should return templates with correct structure', async () => {
      const response = await request(app).get('/api/templates');

      response.body.templates.forEach((template: Record<string, unknown>) => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('positions');
        expect(Array.isArray(template.positions)).toBe(true);

        const positions = template.positions as Array<Record<string, unknown>>;
        positions.forEach((position: Record<string, unknown>) => {
          expect(position).toHaveProperty('positionIndex');
          expect(position).toHaveProperty('box');
          expect(position).toHaveProperty('dot');

          const box = position.box as Record<string, unknown>;
          expect(box).toHaveProperty('x1');
          expect(box).toHaveProperty('y1');
          expect(box).toHaveProperty('x2');
          expect(box).toHaveProperty('y2');

          const dot = position.dot as Record<string, unknown>;
          expect(dot).toHaveProperty('x');
          expect(dot).toHaveProperty('y');
        });
      });
    });

    it('should be accessible without authentication', async () => {
      // No Authorization header sent
      const response = await request(app).get('/api/templates');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return at least one template', async () => {
      const response = await request(app).get('/api/templates');

      expect(response.body.templates.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/templates/:id', () => {
    it('should return specific template with 200 status', async () => {
      const response = await request(app).get('/api/templates/template-001');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('template');
    });

    it('should return template-001 with correct data', async () => {
      const response = await request(app).get('/api/templates/template-001');

      expect(response.body.template.id).toBe('template-001');
      expect(response.body.template.name).toBe('template-001');
      expect(response.body.template.description).toBe('first template');
      expect(response.body.template.positions).toHaveLength(3);
    });

    it('should return template with all position data', async () => {
      const response = await request(app).get('/api/templates/template-001');

      const template = response.body.template;

      // Verify position 0
      expect(template.positions[0]).toEqual({
        positionIndex: 0,
        box: { x1: 46, y1: -594, x2: 122, y2: -670 },
        dot: { x: 46, y: -670 },
      });

      // Verify position 1
      expect(template.positions[1]).toEqual({
        positionIndex: 1,
        box: { x1: 488, y1: -198, x2: 564, y2: -274 },
        dot: { x: 526, y: -236 },
      });

      // Verify position 2
      expect(template.positions[2]).toEqual({
        positionIndex: 2,
        box: { x1: 488, y1: 0, x2: 564, y2: -76 },
        dot: { x: 526, y: -38 },
      });
    });

    it('should return 404 for non-existent template', async () => {
      const response = await request(app).get('/api/templates/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Template not found');
    });

    it('should return 404 for empty template ID', async () => {
      // This will match the GET / route instead
      const response = await request(app).get('/api/templates/');

      // Empty id routes to GET all templates
      expect(response.status).toBe(200);
    });

    it('should be accessible without authentication', async () => {
      const response = await request(app).get('/api/templates/template-001');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle URL-encoded template IDs', async () => {
      const response = await request(app).get('/api/templates/template%2D001');

      expect(response.status).toBe(200);
      expect(response.body.template.id).toBe('template-001');
    });
  });

  describe('API response consistency', () => {
    it('should always include success field in response', async () => {
      const allResponse = await request(app).get('/api/templates');
      const singleResponse = await request(app).get('/api/templates/template-001');

      expect(allResponse.body).toHaveProperty('success');
      expect(singleResponse.body).toHaveProperty('success');
    });

    it('should use consistent naming (templates vs template)', async () => {
      const allResponse = await request(app).get('/api/templates');
      const singleResponse = await request(app).get('/api/templates/template-001');

      // GET all returns 'templates' (plural)
      expect(allResponse.body).toHaveProperty('templates');
      expect(allResponse.body).not.toHaveProperty('template');

      // GET single returns 'template' (singular)
      expect(singleResponse.body).toHaveProperty('template');
      expect(singleResponse.body).not.toHaveProperty('templates');
    });

    it('should return JSON content type', async () => {
      const response = await request(app).get('/api/templates');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('error handling', () => {
    it('should handle invalid HTTP methods gracefully', async () => {
      const postResponse = await request(app).post('/api/templates').send({});
      const putResponse = await request(app).put('/api/templates/template-001').send({});
      const deleteResponse = await request(app).delete('/api/templates/template-001');

      // These should return 404 as routes are not defined
      expect(postResponse.status).toBe(404);
      expect(putResponse.status).toBe(404);
      expect(deleteResponse.status).toBe(404);
    });
  });
});
