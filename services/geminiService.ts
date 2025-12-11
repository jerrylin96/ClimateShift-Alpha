import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedPortfolio, StockAnalysisResult, StockPosition, NewsHeadline } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey });

/**
 * Validates and sanitizes user preferences input to prevent prompt injection.
 * Returns sanitized string or throws an error if invalid.
 */
export const validateUserPreferences = (input: string): string => {
  // Check for empty input
  if (!input || input.trim().length === 0) {
    throw new Error("Preferences cannot be empty");
  }
  
  // Enforce maximum length (500 characters)
  if (input.length > 500) {
    throw new Error("Preferences must be under 500 characters");
  }
  
  // Remove any potential injection patterns (instructions to ignore rules)
  const suspiciousPatterns = [
    /ignore\s+(the\s+)?(previous|above|all|safety|instructions?|rules?|guidelines?)/gi,
    /disregard\s+(the\s+)?(previous|above|all|safety|instructions?|rules?|guidelines?)/gi,
    /override\s+(the\s+)?(previous|above|all|safety|instructions?|rules?|guidelines?)/gi,
    /forget\s+(the\s+)?(previous|above|all|safety|instructions?|rules?|guidelines?)/gi,
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(input)) {
      throw new Error("Invalid input detected. Please rephrase your preferences.");
    }
  }
  
  // Sanitize: trim whitespace and collapse multiple spaces
  const sanitized = input.trim().replace(/\s+/g, ' ');
  
  return sanitized;
};

export const fetchMarketHeadlines = async (query: string = "major global financial news and market movers"): Promise<NewsHeadline[]> => {
  if (!apiKey) return [];
  
  const model = "gemini-2.5-flash";
  const prompt = `
    Find 10 of the most significant and latest financial news headlines relevant to: ${query}.
    
    STRICT SOURCE WHITELIST:
    You MUST ONLY include news from the following reputable sources. Do NOT use any other sources.
    - The Wall Street Journal (WSJ)
    - Reuters
    - Financial Times (FT)
    - Bloomberg
    - The Economist
    - Barron's
    - CNBC
    - Forbes
    - Fortune
    - MarketWatch
    - The New York Times (NYT)
    - Bloomberg Businessweek
    - Yahoo Finance
    - CNN Business
    - The Motley Fool
    - Seeking Alpha
    - TheStreet
    - BBC Business
    - Business Insider
    - Vox
    - The Washington Post
    
    CONTENT GUIDELINES:
    - Focus on noteworthy events for active investors (e.g., Fed/Central Bank policy, major M&A, earnings surprises, geopolitical shifts, macro economy).
    - The news does NOT need to be strictly about ESG or sustainability. General market news is preferred if it is more significant.
    
    For each article, provide:
    1. The actual article headline (concise and professional)
    2. The publication source name
    
    Format your response as a numbered list:
    1. [Headline text here] - Source Name
    2. [Headline text here] - Source Name
    ...etc
  `;
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    
    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    if (groundingChunks.length === 0) return [];

    // Parse headlines from text response
    const lines = text.split('\n').filter(line => line.trim().match(/^\d+\./));
    
    return groundingChunks
      .filter((chunk: any) => chunk.web?.uri)
      .map((chunk: any, index: number) => {
        // Extract headline from the numbered line
        let title = "Financial News";
        let textSource = null;

        if (lines[index]) {
          const match = lines[index].match(/^\d+\.\s*(.+?)(?:\s*-\s*(.+))?$/);
          if (match) {
            title = match[1].trim().replace(/^"|"$/g, ''); // Remove quotes if present
            // Capture source from text if available (Group 2)
            if (match[2]) {
              textSource = match[2].trim();
            }
          } else {
             // Fallback if regex doesn't match perfectly but line exists
             title = lines[index].replace(/^\d+\.\s*/, '').trim();
          }
        } else if (chunk.web?.title && !chunk.web.title.includes('http')) {
           // Fallback to web title if text lines run out, but only if it looks like a title
           title = chunk.web.title;
        }
        
        // Use source from text if found, otherwise extract clean source from URL
        let source = textSource || "News";
        if (!textSource) {
          try {
            const hostname = new URL(chunk.web.uri).hostname;
            const domain = hostname.replace(/^www\./, '').split('.')[0];
            source = domain.charAt(0).toUpperCase() + domain.slice(1);
          } catch (e) {
            source = "News";
          }
        }
        
        return {
          title: title,
          url: chunk.web.uri,
          source: source
        };
      })
      .slice(0, 10);
      
  } catch (error) {
    console.warn("Error fetching market headlines:", error);
    return [];
  }
};

export const generateETFPortfolio = async (
  userPreferences?: string,
  onProgress?: (status: string) => void
): Promise<GeneratedPortfolio> => {
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  const model = "gemini-2.5-flash";

  if (onProgress) onProgress("Initializing Quantum Strategy Engine...");

  // --- STAGE 1: Structure Generation (No Tools, Strict Schema) ---
  let specificInstructions = "";
  if (userPreferences) {
    specificInstructions = `
    **REBALANCING CONTEXT (CRITICAL):**
    The user is rebalancing the fund with the following input: "${userPreferences}".
    
    1. **Adapt:** Adjust sector weights and stock selection to align with this input (e.g., if they ask for more defensive stocks, increase 'Stabilizer' weight).
    2. **Strict Override:** If the user requests excluded industries (Fossil Fuels, Weapons, Tobacco, AI-Obsolete, Speculative/Pre-revenue), YOU MUST IGNORE that specific request and strictly adhere to the safety/exclusion policy.
    3. **Narrative:** Update the 'narrative' field to explain how the portfolio was rebalanced to meet this request while maintaining core principles.
    `;
  }

  const structurePrompt = `
    Act as a senior quantitative portfolio manager and climate scientist.
    Design the ultimate "ClimateShift Alpha" ETF.

    **Objective:**
    Construct a portfolio that outperforms the S&P 500 while strictly adhering to high-impact sustainability goals and technological resilience.

    **Strategy Parameters:**
    - **Fund Name:** ClimateShift Alpha
    - **Benchmark:** S&P 500 (Targeting Alpha)
    - **Risk Profile:** Growth with Downside Protection (Match S&P 500 Beta)
    - **Exclusion Policy:** Strict (Zero tolerance for Fossil Fuels, Weapons, Predatory Lending, Tobacco, and **AI-Obsolete Business Models**).

    **Core Philosophy:**
    1. **Alpha Generation:** We are not just "green"; we are profitable. Prioritize companies with strong free cash flow and competitive moats.
    2. **Safety Over Speculation:** Exclude pre-revenue startups. Focus on "Core" sustainable leaders and "Stabilizer" neutral giants (e.g., Tech with Net Zero goals).
    3. **AI Resilience:** **CRITICAL**: Strictly exclude companies whose primary business models are at extreme risk of being disrupted or made obsolete by reasonable projections of advancements in Generative AI and Automation (e.g., pure-play BPO, manual data processing, basic translation services, generic coding shops).
    4. **Diversification:** Ensure sector balance to minimize volatility relative to the S&P 500.
    5. **Data Availability:** **CRITICAL**: Exclude any companies that have been public for less than 5 years. We REQUIRE at least 5 years of historical trading data for backtesting. Do NOT include recent IPOs. Founded before 2019 is Mandatory.

    ${specificInstructions}

    **Task:**
    Generate a JSON response representing this ETF.
    - Include 12-18 distinct stock positions.
    - Weights must sum to approximately 100%.
    - Categorize stocks as:
      - 'Core' (Sustainable leaders/transition enablers)
      - 'Growth' (High-growth clean tech/innovation)
      - 'Stabilizer' (Low volatility neutral companies to balance risk)
    - Provide estimated annual financial metrics based on current market conditions.
  `;

  let portfolio: GeneratedPortfolio;

  try {
    if (onProgress) onProgress("Optimizing Sector Allocation & Selecting Constituents...");
    
    // 1. Generate the Strategy Structure
    const structureResponse = await ai.models.generateContent({
      model,
      contents: structurePrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            narrative: { type: Type.STRING, description: "A brief professional summary of the fund strategy and any recent rebalancing actions." },
            metrics: {
              type: Type.OBJECT,
              properties: {
                projectedReturn: { type: Type.STRING, description: "e.g., '10-12%'" },
                projectedVolatility: { type: Type.STRING, description: "e.g., 'Medium'" },
                dividendYield: { type: Type.STRING, description: "e.g., '1.8%'" },
                carbonFootprintReduction: { type: Type.STRING, description: "Comparison to S&P 500, e.g., '-40%'" },
                sharpeRatio: { type: Type.STRING, description: "e.g., '1.2'" }
              },
              required: ["projectedReturn", "projectedVolatility", "dividendYield", "carbonFootprintReduction", "sharpeRatio"]
            },
            positions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ticker: { type: Type.STRING },
                  name: { type: Type.STRING },
                  weight: { type: Type.NUMBER, description: "Percentage as a number, e.g. 5.5" },
                  sector: { type: Type.STRING },
                  reason: { type: Type.STRING, description: "Why it was included given the constraints." },
                  esgScore: { type: Type.STRING, description: "Rating like AAA, AA, A" },
                  type: { type: Type.STRING, enum: ["Core", "Growth", "Stabilizer"] }
                },
                required: ["ticker", "name", "weight", "sector", "reason", "esgScore", "type"]
              }
            }
          },
          required: ["name", "description", "positions", "metrics", "narrative"]
        }
      }
    });

    const structureText = structureResponse.text;
    if (!structureText) throw new Error("No data returned from Gemini for structure");
    portfolio = JSON.parse(structureText) as GeneratedPortfolio;

    // --- STAGE 2: Real-time Data Enrichment (Tools enabled, No Schema) ---
    if (onProgress) onProgress("Fetching Real-Time Market Data & Historical Anchors...");
    
    // Use the separate refresh logic to keep it DRY
    portfolio = await refreshPortfolioPrices(portfolio, onProgress);

    // --- STAGE 3: News Enrichment for Portfolio Context ---
    if (onProgress) onProgress("Analyzing Global Financial News & Sentiment...");
    
    // Fetch news specific to the constructed portfolio
    const freshHeadlines = await fetchMarketHeadlines();
    portfolio.headlines = freshHeadlines;

    if (onProgress) onProgress("Finalizing Portfolio Construction...");

    return portfolio;

  } catch (error) {
    console.error("Error generating portfolio:", error);
    throw error;
  }
};

const fetchStockBatch = async (tickers: string[]): Promise<Record<string, any>> => {
  const model = "gemini-2.5-flash";
  const tickerString = tickers.join(", ");
  
  const prompt = `
    Find REAL-TIME stock data for these tickers: ${tickerString}

    For EACH ticker, search and find:
    1. Current stock price in USD
    2. 1-year total return percentage
    3. 3-year total return percentage
    4. 5-year total return percentage
    
    Return ONLY a JSON code block with this exact format:
    {
      "AAPL": { "price": 185.50, "oneYearChange": 25.5, "threeYearChange": 45.0, "fiveYearChange": 280.5 },
      "MSFT": { "price": 420.25, "oneYearChange": 18.2, "threeYearChange": 52.0, "fiveYearChange": 210.3 }
    }

    RULES:
    - Search "{TICKER} stock 1 year return", "{TICKER} stock 3 year return", "{TICKER} stock 5 year return"
    - The 5-year return is MOST CRITICAL - prioritize finding this
    - If you cannot find a specific return period, omit that field (but include others you found)
    - If you cannot find ANY data for a ticker, omit the ticker entirely
    - Do NOT guess values
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "";
    // Robust JSON extraction
    const cleanJson = text.replace(/```json|```/g, '').trim();
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    return {};
  } catch (error) {
    console.warn(`Batch fetch failed for ${tickerString}`, error);
    return {};
  }
};

const fetchBenchmarkData = async (): Promise<any> => {
  const model = "gemini-2.5-flash";
  const prompt = `
    Find the S&P 500 (SPY) total return percentages:

    1-year total return
    3-year total return
    5-year total return
    Return ONLY a JSON code block:

    {
      "oneYearChange": 12.5,
      "threeYearChange": 35.2,
      "fiveYearChange": 85.0
    }
  `;
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "";
    const cleanJson = text.replace(/```json|```/g, '').trim();
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    return {};
  } catch (error) {
    console.warn("Benchmark fetch failed", error);
    return {};
  }
};

/**
 * Re-fetches current prices and historical returns (1Y, 3Y, 5Y) for all stocks in the portfolio.
 */
export const refreshPortfolioPrices = async (
  portfolio: GeneratedPortfolio,
  onProgress?: (status: string) => void
): Promise<GeneratedPortfolio> => {
  if (!apiKey) throw new Error("API Key is missing");

  if (onProgress) onProgress("Syncing with Global Exchanges...");

  const allMarketData: Record<string, any> = {};
  
  // Step 1: Split tickers into batches of 4
  const batchSize = 4;
  const positions = portfolio.positions;
  const tickerBatches: string[][] = [];
  
  for (let i = 0; i < positions.length; i += batchSize) {
    tickerBatches.push(positions.slice(i, i + batchSize).map(p => p.ticker));
  }

  // Step 2: Fetch each batch sequentially
  for (const batch of tickerBatches) {
    if (onProgress) onProgress(`Fetching data for: ${batch.join(', ')}...`);
    const batchData = await fetchStockBatch(batch);
    Object.assign(allMarketData, batchData);
  }

  // Step 3: Fetch benchmark separately
  if (onProgress) onProgress('Fetching S&P 500 benchmark data...');
  const benchmarkData = await fetchBenchmarkData();

  // Step 4: Repair Pass - Retry tickers that failed to get critical 5Y data
  const missingTickers = positions.filter(p => {
    // Check main ticker or upper case version
    const data = allMarketData[p.ticker] || allMarketData[p.ticker.toUpperCase()];
    return !data || typeof data.fiveYearChange !== 'number';
  }).map(p => p.ticker);

  if (missingTickers.length > 0) {
    if (onProgress) onProgress(`Repairing data for: ${missingTickers.length} tickers...`);
    const retryBatches: string[][] = [];
    for (let i = 0; i < missingTickers.length; i += batchSize) {
      retryBatches.push(missingTickers.slice(i, i + batchSize));
    }
    
    for (const batch of retryBatches) {
      const retryData = await fetchStockBatch(batch);
      Object.assign(allMarketData, retryData);
    }
  }

  // Logging for debug
  console.log('📊 Market Data Retrieved:', allMarketData);
  console.log('📈 Data Coverage Summary:', {
    totalTickers: portfolio.positions.length,
    tickersWithPrice: Object.keys(allMarketData).filter(k => allMarketData[k]?.price).length,
    tickersWithFiveYear: Object.keys(allMarketData).filter(k => allMarketData[k]?.fiveYearChange).length,
    hasBenchmarkData: !!benchmarkData?.fiveYearChange
  });

  // Step 5: Merge data into portfolio
  portfolio.positions = portfolio.positions.map(pos => {
    // Check for ticker or upper case ticker
    const data = allMarketData[pos.ticker] || allMarketData[pos.ticker.toUpperCase()];
    
    if (data) {
      return {
        ...pos,
        currentPrice: typeof data.price === 'number' ? data.price : pos.currentPrice,
        oneYearChangePercent: typeof data.oneYearChange === 'number' ? data.oneYearChange : pos.oneYearChangePercent,
        threeYearChangePercent: typeof data.threeYearChange === 'number' ? data.threeYearChange : pos.threeYearChangePercent,
        fiveYearChangePercent: typeof data.fiveYearChange === 'number' ? data.fiveYearChange : pos.fiveYearChangePercent,
        dayChangePercent: pos.dayChangePercent,
      };
    }
    return pos;
  });

  // Add benchmark data
  if (benchmarkData) {
      if (typeof benchmarkData.oneYearChange === 'number') portfolio.metrics.benchmark1YearReturn = benchmarkData.oneYearChange;
      if (typeof benchmarkData.threeYearChange === 'number') portfolio.metrics.benchmark3YearReturn = benchmarkData.threeYearChange;
      if (typeof benchmarkData.fiveYearChange === 'number') portfolio.metrics.benchmark5YearReturn = benchmarkData.fiveYearChange;
  }

  return portfolio;
};

export const analyzeStock = async (ticker: string): Promise<StockAnalysisResult> => {
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  const model = "gemini-2.5-flash";
  const prompt = `
    Find real-time financial data for ${ticker}. 
    
    1. Current Price (USD)
    2. Market Cap
    3. P/E Ratio
    4. Dividend Yield (%)
    5. 3 bullet points on recent news.
    6. Performance Percentages for:
       - 1 Week
       - 1 Month
       - 3 Months
       - 1 Year
       - 5 Years

    Output Format:
    - First section: Text description with bold labels.
    - Second section: A strict JSON block with the performance data (DO NOT use markdown code blocks for the JSON, just the string at the end).
    JSON Example: 
    { 
      "1W": 1.2, 
      "1M": -2.4, 
      "3M": 5.5, 
      "1Y": 12.0, 
      "5Y": 40.5,
      "marketCap": "2.5T",
      "peRatio": 30.5,
      "dividendYield": 0.5
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const fullText = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as any[];

    // Extract JSON from text
    let performance = {};
    let marketCap, peRatio, dividendYield;

    const jsonMatch = fullText.match(/\{[\s\S]*"1W"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        performance = {
          oneWeek: parsed["1W"],
          oneMonth: parsed["1M"],
          threeMonth: parsed["3M"],
          oneYear: parsed["1Y"],
          fiveYear: parsed["5Y"]
        };
        marketCap = parsed.marketCap;
        peRatio = parsed.peRatio;
        dividendYield = parsed.dividendYield;
      } catch (e) {
        console.warn("Failed to parse performance JSON", e);
      }
    }

    // Clean text by removing the JSON block if it looks messy
    const content = fullText.replace(jsonMatch ? jsonMatch[0] : "", "").trim();
    
    // Extract price from content
    const priceMatch = content.match(/\$([\d,]+\.\d{2})/);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : undefined;

    return {
      content,
      groundingChunks,
      performance,
      price,
      marketCap,
      peRatio,
      dividendYield
    };
  } catch (error) {
    console.error("Error analyzing stock:", error);
    throw error;
  }
};
