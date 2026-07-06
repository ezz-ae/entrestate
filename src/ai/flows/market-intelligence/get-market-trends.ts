
'use server';

/**
 * @fileOverview An AI flow to synthesize market trends from qualitative data sources.
 *
 * This flow acts as an expert analyst, reviewing sources like Property Finder's
 * Insights Hub to provide a summary of emerging trends for a given topic.
 *
 * @module AI/Flows/GetMarketTrends
 *
 * @export {function} getMarketTrends - The main function to generate the trend analysis.
 * @export {type} GetMarketTrendsInput - The Zod schema for the input.
 * @export {type} GetMarketTrendsOutput - The Zod schema for the output.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * Defines the schema for the input of the market trends flow.
 */
const GetMarketTrendsInputSchema = z.object({
  topic: z.string().describe('The real estate topic to analyze (e.g., "Dubai rental yields").'),
});
export type GetMarketTrendsInput = z.infer<typeof GetMarketTrendsInputSchema>;

/**
 * Defines the schema for a single forecast data point.
 */
const ForecastDataPointSchema = z.object({
    date: z.string().describe('The date for the forecast point (e.g., "Jan 2025").'),
    predictedValue: z.number().describe('The AI-predicted value for this point.'),
    lowerBound: z.number().describe('The lower bound of the confidence interval.'),
    upperBound: z.number().describe('The upper bound of the confidence interval.'),
});

/**
 * Defines the schema for the output of the market trends flow.
 */
const GetMarketTrendsOutputSchema = z.object({
  overallSentiment: z.string().describe('A summary of the general market sentiment on the topic (e.g., "Optimistic," "Cautious").'),
  emergingTrends: z.array(z.object({
    trend: z.string().describe('A specific emerging trend.'),
    description: z.string().describe('A brief description of the trend and its potential impact.'),
  })).describe('A list of 2-4 key emerging trends identified from the sources.'),
  futureOutlook: z.string().describe('A forward-looking statement on what to expect in the coming months.'),
  keyOpportunities: z.array(z.object({
      opportunity: z.string().describe("A specific, actionable opportunity."),
      rationale: z.string().describe("The data-driven reason this opportunity exists."),
  })).describe("A list of 2-3 actionable opportunities for an agent or investor."),
  optimizationSuggestions: z.array(z.object({
      suggestion: z.string().describe("A concrete suggestion for optimizing a strategy."),
      impact: z.string().describe("The potential impact of implementing this suggestion."),
  })).describe("A list of 2-3 optimization suggestions."),
  forecastData: z.array(ForecastDataPointSchema).describe("A 6-month time-series forecast for the topic, including confidence intervals."),
});
export type GetMarketTrendsOutput = z.infer<typeof GetMarketTrendsOutputSchema>;

/**
 * An AI flow that analyzes market trends for a specific topic.
 *
 * @param {GetMarketTrendsInput} input - The input data for the analysis.
 * @returns {Promise<GetMarketTrendsOutput>} A promise that resolves with the trend analysis.
 */
export async function getMarketTrends(
  input: GetMarketTrendsInput
): Promise<GetMarketTrendsOutput> {
  return getMarketTrendsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getMarketTrendsPrompt',
  input: {schema: GetMarketTrendsInputSchema},
  output: {schema: GetMarketTrendsOutputSchema},
  prompt: `You are an expert real estate market analyst and forecasting agent, combining the skills of an LLM Auditor, an Optimizer, and a Data Scientist. Your task is to provide a comprehensive market intelligence report based on the provided topic, using simulated data from sources like Property Finder Insights Hub, Bayut, and DLD.

  **Topic:** {{{topic}}}

  **Instructions:**

  1.  **Synthesize Information & Determine Sentiment:** Based on the topic, provide a high-level summary of the market sentiment (e.g., "Optimistic," "Cautious").
  2.  **Identify Key Emerging Trends:** List 2-4 significant new trends. For each, provide a brief description.
  3.  **Offer a Future Outlook:** Based on the trends, provide a brief forecast for the next 3-6 months.
  4.  **Uncover Key Opportunities (Data Science):** Identify 2-3 specific, actionable opportunities that a real estate professional could capitalize on based on the data. For each, provide a clear rationale. (e.g., "Opportunity: Target 1-bedroom apartments in JVC for rental investment. Rationale: Rental yields in JVC for 1-beds have increased by 8% YoY, while sales prices have only risen 4%, indicating a strong rental market.").
  5.  **Provide Optimization Suggestions (Optimizer/Auditor):** Give 2-3 concrete suggestions for how an agent or developer could optimize their strategy in response to these trends. For each, state the potential impact. (e.g., "Suggestion: Audit your existing listings in Downtown Dubai. Impact: Listings with 'Burj Khalifa view' in the title have a 15% higher click-through-rate.").
  6.  **Generate a Forecast:** Create a 6-month time-series forecast for the topic. Provide a predicted value for each month, along with a plausible lower and upper bound for a confidence interval.
  `,
});

const getMarketTrendsFlow = ai.defineFlow(
  {
    name: 'getMarketTrendsFlow',
    inputSchema: GetMarketTrendsInputSchema,
    outputSchema: GetMarketTrendsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error('The AI failed to generate a market trend analysis.');
    }
    return output;
  }
);
