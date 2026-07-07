
'use server';

/**
 * @fileOverview An AI flow to generate a comprehensive market report for a specific location.
 *
 * This flow synthesizes market data to produce a narrative report on trends,
 * pricing, and sentiment, acting as a proactive "Watcher" agent.
 *
 * @module AI/Flows/GenerateMarketReport
 *
 * @export {function} generateMarketReport - The main function to generate the report.
 * @export {type} GenerateMarketReportInput - The Zod schema for the input.
 * @export {type} GenerateMarketReportOutput - The Zod schema for the output.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * Defines the schema for the input of the market report flow.
 */
const GenerateMarketReportInputSchema = z.object({
  location: z.string().describe('The city or neighborhood for the report.'),
  propertyType: z.string().describe('The specific property type to focus on (e.g., "luxury condos").'),
  reportType: z.enum(['Investor', 'Home Buyer', 'Seller']).describe('The target audience for the report.'),
});
export type GenerateMarketReportInput = z.infer<typeof GenerateMarketReportInputSchema>;

/**
 * Defines the schema for the output of the market report flow.
 */
const GenerateMarketReportOutputSchema = z.object({
  reportTitle: z.string().describe('A compelling title for the report.'),
  executiveSummary: z.string().describe('A brief, high-level summary of the key findings.'),
  marketTrends: z.array(z.object({
    trend: z.string().describe('A specific market trend.'),
    analysis: z.string().describe('A brief analysis of the trend and its impact.'),
  })).describe('A list of current market trends and their analysis.'),
  pricingAnalysis: z.string().describe('An analysis of current pricing, including average prices and recent changes.'),
  futureOutlook: z.string().describe('A forward-looking statement on what to expect in the coming months.'),
});
export type GenerateMarketReportOutput = z.infer<typeof GenerateMarketReportOutputSchema>;

/**
 * An AI flow that generates a market report for a specific location.
 *
 * @param {GenerateMarketReportInput} input - The input data for the report.
 * @returns {Promise<GenerateMarketReportOutput>} A promise that resolves with the report data.
 */
export async function generateMarketReport(
  input: GenerateMarketReportInput
): Promise<GenerateMarketReportOutput> {
  return generateMarketReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMarketReportPrompt',
  input: {schema: GenerateMarketReportInputSchema},
  output: {schema: GenerateMarketReportOutputSchema},
  prompt: `You are an expert real estate market analyst. Your task is to generate a comprehensive, data-driven market report for the specified location and property type.

  **Location:** {{{location}}}
  **Property Type Focus:** {{{propertyType}}}
  **Target Audience:** {{{reportType}}}

  **Instructions:**

  1.  **Generate a Compelling Title:** Create a clear and engaging title for the report.
  2.  **Write an Executive Summary:** Provide a concise overview of the most critical takeaways for the target audience.
  3.  **Identify Key Market Trends:** List 3-4 significant current trends (e.g., "Inventory levels are down 15% year-over-year," "Demand for properties with home offices is surging"). For each trend, provide a brief analysis of its impact.
  4.  **Provide Pricing Analysis:** Discuss the current state of pricing for the specified property type. Include average price points, recent appreciation/depreciation, and the general pricing sentiment (e.g., "competitive," "buyer's market").
  5.  **Offer a Future Outlook:** Based on the data, provide a brief forecast of what to expect in the next 3-6 months.

  Tailor the language and focus to be most valuable for the specified **Target Audience**. 
  - For an 'Investor' report, focus on ROI, cap rates, rental demand, and yield.
  - For a 'Home Buyer' report, focus on lifestyle, amenities, value, and long-term appreciation.
  - For a 'Seller' report, focus on optimal listing price, time on market, and what features are currently selling best.
  `,
});

const generateMarketReportFlow = ai.defineFlow(
  {
    name: 'generateMarketReportFlow',
    inputSchema: GenerateMarketReportInputSchema,
    outputSchema: GenerateMarketReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error('The AI failed to generate a market report.');
    }
    return output;
  }
);
