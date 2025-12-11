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
    it('returns parsed headlines when API returns valid data with grounding chunks', async () => {
      // Logic expects numbered list in text + grounding chunks
      const mockResponseText = `
      1. Test News - Test Source
      2. Another Story - Source Two
      `;
      
      const mockChunks = [
        {
          web: {
            uri: "http://test.com/some/article",
            title: "Test News"
          }
        },
        {
          web: {
            uri: "http://example.com/another/story",
            title: "Another Story"
          }
        }
      ];

      mockGenerateContent.mockResolvedValue({
        text: mockResponseText,
        candidates: [{
          groundingMetadata: {
            groundingChunks: mockChunks
          }
        }]
      });

      const headlines = await fetchMarketHeadlines();
      
      expect(headlines).toHaveLength(2);
      expect(headlines[0].title).toBe("Test News");
      expect(headlines[0].url).toBe("http://test.com/some/article");
      expect(headlines[0].source).toBe("Test"); // Extracted from domain

      expect(headlines[1].title).toBe("Another Story");
      expect(headlines[1].url).toBe("http://example.com/another/story");
      expect(headlines[1].source).toBe("Example"); // Extracted from domain
      
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('returns empty array when API returns no grounding chunks', async () => {
      mockGenerateContent.mockResolvedValue({
        text: "Some text",
        candidates: [{
          groundingMetadata: {
            groundingChunks: []
          }
        }]
      });

      const headlines = await fetchMarketHeadlines();
      expect(headlines).toEqual([]);
    });

    it('handles cases where text source is missing but domain can be extracted', async () => {
      const mockResponseText = `
      1. Market Up
      `;
      const mockChunks = [
        {
          web: {
            uri: "http://www.bloomberg.com/news/123",
            title: "Market Up"
          }
        }
      ];

      mockGenerateContent.mockResolvedValue({
        text: mockResponseText,
        candidates: [{
          groundingMetadata: {
            groundingChunks: mockChunks
          }
        }]
      });

      const headlines = await fetchMarketHeadlines();
      expect(headlines).toHaveLength(1);
      expect(headlines[0].title).toBe("Market Up");
      expect(headlines[0].source).toBe("Bloomberg"); // Extracted from URL
    });
  });
});