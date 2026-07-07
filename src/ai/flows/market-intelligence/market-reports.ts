
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the structured input for the market report flow
const MarketReportInputSchema = z.object({
  location: z.string().describe("The specific location for the report (e.g., 'Dubai Marina', 'Downtown Dubai')."),
  audience: z.enum(['Investor', 'Buyer', 'Seller']).describe("The target audience for the report, which will tailor the narrative."),
});
export type MarketReportInput = z.infer<typeof MarketReportInputSchema>;


// Define the structured output for the report
const MarketReportOutputSchema = z.object({
  title: z.string().describe("A compelling title for the report."),
  executiveSummary: z.string().describe("A concise, high-level overview of the market."),
  keyMarketTrends: z.array(z.string()).describe("A list of 3-5 key trends impacting the area."),
  pricingAnalysis: z.string().describe("An analysis of current pricing, including average price per sqft and recent sales trends."),
  futureOutlook: z.string().describe("An AI-powered forecast for the market's future performance."),
  recommendation: z.string().describe("A final, tailored recommendation for the specified audience."),
});
export type MarketReportOutput = z.infer<typeof MarketReportOutputSchema>;


const marketReportPrompt = ai.definePrompt({
    name: 'marketReportPrompt',
    input: { schema: MarketReportInputSchema },
    output: { schema: MarketReportOutputSchema },
    prompt: `
      You are a senior real estate market analyst with 25 years of experience in the Dubai/UAE market. Your task is to generate a comprehensive, data-rich, and narrative-driven market report for the specified location, tailored to the target audience.

      **Location:**
      {{{location}}}

      **Target Audience:**
      {{{audience}}}

      **Instructions:**

      1.  **Title:** Create a compelling title for the report.
      2.  **Executive Summary:** Write a concise, high-level overview of the current state of the {{{location}}} market.
      3.  **Key Market Trends:** Identify and describe 3-5 key trends currently impacting the area (e.g., demand for waterfront properties, rise of short-term rentals, new infrastructure projects).
      4.  **Pricing Analysis:** Provide an analysis of current pricing. Include metrics like average price per square foot, recent sales trends (e.g., "up 5% QoQ"), and typical rental yields.
      5.  **Future Outlook:** Based on the data, provide an AI-powered forecast for the market's future performance over the next 12-24 months.
      6.  **Recommendation:** Provide a final, tailored recommendation specifically for a(n) {{{audience}}}. For an Investor, focus on ROI. For a Buyer, focus on lifestyle and long-term value. For a Seller, focus on market timing and pricing strategy.

      Structure the output to be a complete, professional report.
    `
});

// Define the Genkit flow for generating market reports
export const marketReportFlow = ai.defineFlow(
  {
    name: 'marketReportFlow',
    inputSchema: MarketReportInputSchema,
    outputSchema: MarketReportOutputSchema,
  },
  async (input) => {
    const { output } = await marketReportPrompt(input);
    if (!output) {
      throw new Error("The AI failed to generate a valid market report.");
    }
    return output;
  }
);
