import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI client utility on the server with User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface RegionalVarianceItem {
  region: string;
  q2Revenue: number;
  q3Revenue: number;
  delta: number;
  pctChange: number | null;
}

app.post('/api/generate-summary', async (req, res) => {
  try {
    const { regionalData, maxChangedRegion, totalQ2, totalQ3, overallDelta, overallPctChange } = req.body;

    if (!regionalData || !Array.isArray(regionalData) || regionalData.length === 0) {
      return res.status(400).json({ error: 'Missing regional variance data.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel in AI Studio.',
      });
    }

    const formatCurrency = (val: number) =>
      `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const formatPercent = (pct: number | null) =>
      pct !== null ? `${pct > 0 ? '+' : ''}${Number(pct).toFixed(1)}%` : 'N/A';

    const dataSummaryText = regionalData
      .map(
        (r: RegionalVarianceItem) =>
          `- ${r.region}: Q2 Revenue = ${formatCurrency(r.q2Revenue)}, Q3 Revenue = ${formatCurrency(
            r.q3Revenue
          )}, Difference = ${r.delta >= 0 ? '+' : ''}${formatCurrency(r.delta)} (${formatPercent(r.pctChange)})`
      )
      .join('\n');

    const prompt = `Calculated Sales Order Data for Q2 to Q3:

Overall Portfolio Totals:
- Q2 Total Revenue: ${formatCurrency(totalQ2)}
- Q3 Total Revenue: ${formatCurrency(totalQ3)}
- Total Portfolio Difference: ${overallDelta >= 0 ? '+' : ''}${formatCurrency(overallDelta)} (${formatPercent(overallPctChange)})

Calculated Regional Changes from Q2 to Q3:
${dataSummaryText}

Identified Region with Greatest Absolute Dollar Change:
- Region: ${maxChangedRegion.region}
- Q2 Revenue: ${formatCurrency(maxChangedRegion.q2Revenue)}
- Q3 Revenue: ${formatCurrency(maxChangedRegion.q3Revenue)}
- Dollar Difference: ${maxChangedRegion.delta >= 0 ? '+' : ''}${formatCurrency(maxChangedRegion.delta)}
- Percentage Difference: ${formatPercent(maxChangedRegion.pctChange)}

INSTRUCTIONS:
Write EXACTLY a three-sentence executive summary explaining which region changed the most in revenue from Q2 to Q3, and why.

CRITICAL CONSTRAINTS:
1. Write EXACTLY three sentences. Not two, not four. Exactly three sentences.
2. Use ONLY the figures provided above. Do NOT assume, invent, or speculate about outside real-world causes (such as marketing, seasonal patterns, customer growth, or macroeconomic factors).
3. Explain the 'why' STRICTLY using the calculated numerical figures provided (e.g. noting how its dollar difference and percentage shift compares against the figures of the other regions).
4. Sentence 1: Identify the region that changed the most from Q2 to Q3, citing its exact Q2 revenue, Q3 revenue, and dollar/percentage difference.
5. Sentence 2: Explain why this region represents the largest change by directly referencing the comparative numbers of the other regions.
6. Sentence 3: Summarize the net impact of this regional shift on the total portfolio revenue using the calculated totals above.`;

    // Timeout safety race for Gemini call
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Model generation timed out')), 25000)
    );

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are a rigorous financial reporting analyst. You summarize quarterly performance in exactly three sentences using ONLY the provided calculated figures. Never invent outside facts, causes, or unlisted data.',
        temperature: 0.1,
      },
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);
    const summaryText = response.text ? response.text.trim() : '';
    res.json({ summary: summaryText, source: 'gemini' });
  } catch (error: any) {
    console.warn('Gemini summary generation warning:', error?.message);
    res.status(500).json({ error: error?.message || 'Failed to generate AI summary' });
  }
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(process.cwd(), 'dist');

  if (isProduction && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
