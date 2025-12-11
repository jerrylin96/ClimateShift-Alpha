
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchMarketHeadlines } from '../services/geminiService';

// Mock the GoogleGenAI library
const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent
      }
    })),
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      NUMBER: 'NUMBER',
      ARRAY: 'ARRAY'
    }
  };
});

describe('geminiService', () => {
  beforeEach(() => {
    mockGenerateContent.mockClear();
    process.env.API_KEY = 'test-key';
  });

  describe('fetchMarketHeadlines', () => {
    it('returns parsed headlines when API returns valid JSON', async () => {
      const mockResponseText = JSON.stringify({
        headlines: [
          { title: "Test News", source: "Test Source", url: "http://test.com" }
        ]
      });

      mockGenerateContent.mockResolvedValue({
        text: mockResponseText
      });

      const headlines = await fetchMarketHeadlines();
      
      expect(headlines).toHaveLength(1);
      expect(headlines[0].title).toBe("Test News");
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('returns empty array when API returns invalid data', async () => {
      mockGenerateContent.mockResolvedValue({
        text: "Invalid JSON"
      });

      const headlines = await fetchMarketHeadlines();
      expect(headlines).toEqual([]);
    });

    it('handles markdown code blocks in response', async () => {
      const mockResponseText = "```json\n" + JSON.stringify({
        headlines: [
          { title: "Markdown News", source: "MD", url: "http://md.com" }
        ]
      }) + "\n```";

      mockGenerateContent.mockResolvedValue({
        text: mockResponseText
      });

      const headlines = await fetchMarketHeadlines();
      expect(headlines).toHaveLength(1);
      expect(headlines[0].title).toBe("Markdown News");
    });
  });
});
