
'use server';

/**
 * @fileOverview An AI flow to calculate sales commissions with a detailed breakdown.
 *
 * This flow takes sale price and split percentages, then returns a structured
 * breakdown of the total commission, the agent's share, and the brokerage's share.
 *
 * @module AI/Flows/Sales/CommissionCalculator
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

/**
 * Defines the schema for the input of the commission calculator flow.
 */
const CommissionCalculatorInputSchema = z.object({
  salePrice: z.number().positive().describe('The total sale price of the property.'),
  commissionRate: z.number().positive().describe('The total commission percentage (e.g., 2 for 2%).'),
  agentSplit: z.number().min(0).max(100).describe('The agent\'s share of the commission (e.g., 50 for 50%).'),
});
export type CommissionCalculatorInput = z.infer<typeof CommissionCalculatorInputSchema>;

/**
 * Defines the schema for the output of the commission calculator flow.
 */
const CommissionCalculatorOutputSchema = z.object({
  totalCommission: z.number().describe('The total commission amount generated from the sale.'),
  yourShare: z.number().describe("The agent's take-home amount from the commission."),
  brokerageShare: z.number().describe("The brokerage's share of the commission."),
  summary: z.string().describe("A human-readable summary of the calculation."),
});
export type CommissionCalculatorOutput = z.infer<typeof CommissionCalculatorOutputSchema>;

/**
 * An AI flow that calculates sales commissions.
 * This function serves as a wrapper for the underlying Genkit flow.
 *
 * @param {CommissionCalculatorInput} input - The input data for the calculation.
 * @returns {Promise<CommissionCalculatorOutput>} A promise that resolves with the commission breakdown.
 */
export async function commissionCalculator(
  input: CommissionCalculatorInput
): Promise<CommissionCalculatorOutput> {
  return commissionCalculatorFlow(input);
}

const commissionCalculatorPrompt = ai.definePrompt({
  name: 'commissionCalculatorPrompt',
  input: { schema: CommissionCalculatorInputSchema },
  output: { schema: CommissionCalculatorOutputSchema },
  prompt: `You are a precise financial calculator for a real estate agency. Your task is to calculate the commission breakdown based on the provided deal details.

  **Deal Details:**
  - Sale Price: {{{salePrice}}}
  - Commission Rate: {{{commissionRate}}}%
  - Agent's Split: {{{agentSplit}}}%

  **Instructions:**
  1.  Calculate the Total Commission: \`salePrice * (commissionRate / 100)\`
  2.  Calculate the Agent's Share: \`Total Commission * (agentSplit / 100)\`
  3.  Calculate the Brokerage's Share: \`Total Commission - Agent's Share\`
  4.  Provide a brief, one-sentence summary of the result.

  Return the calculated values and the summary in the specified output format.
  `,
});


const commissionCalculatorFlow = ai.defineFlow(
  {
    name: 'commissionCalculatorFlow',
    inputSchema: CommissionCalculatorInputSchema,
    outputSchema: CommissionCalculatorOutputSchema,
  },
  async (input) => {
    const { output } = await commissionCalculatorPrompt(input);
    if (!output) {
        throw new Error("The AI failed to calculate the commission.");
    }
    return output;
  }
);
