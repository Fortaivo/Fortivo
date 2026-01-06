import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleResponse, checkApiHealth } from '../lib/api';

describe('API Utilities', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = vi.fn();
  });

  describe('handleResponse', () => {
    it('should parse and return JSON for successful response', async () => {
      const mockData = { id: '1', name: 'Test' };
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockData),
        text: vi.fn().mockResolvedValue(JSON.stringify(mockData))
      } as any;

      const result = await handleResponse(mockResponse);
      expect(result).toEqual(mockData);
    });

    it('should throw error for non-ok response', async () => {
      const mockError = { message: 'Not found' };
      const mockResponse = {
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue(mockError),
        text: vi.fn().mockResolvedValue(JSON.stringify(mockError))
      } as any;

      await expect(handleResponse(mockResponse)).rejects.toThrow('Not found');
    });

    it('should handle malformed JSON gracefully', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
        text: vi.fn().mockResolvedValue('Internal Server Error'),
        statusText: 'Internal Server Error'
      } as any;

      await expect(handleResponse(mockResponse)).rejects.toThrow('Internal Server Error');
    });
  });

  describe('checkApiHealth', () => {
    it('should return true when API is healthy', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ status: 'healthy' })
      });

      const result = await checkApiHealth();
      expect(result).toBe(true);
    });

    it('should return false when API is unhealthy', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await checkApiHealth();
      expect(result).toBe(false);
    });
  });
});
