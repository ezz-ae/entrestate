'use server';

/**
 * @fileOverview An AI flow to analyze a real estate deal's investment potential.
 *
 * This flow now incorporates a "data agent" (fetchMarketData tool) to first
 * estimate market values for a property and then uses those estimates to
 * conduct a full investment analysis, including cash flow, ROI, and cap rate.
 *
 * @module AI/Flows/DealAnalyzer
 *
 * @export {function} dealAnalyzer - The main function to analyze the deal.
 * @export {type} DealAnalyzerInput - The Zod schema for the input.
 * @export {type} DealAnalyzerOutput - The Zod schema for the output.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * Defines the schema for the input of the deal analyzer flow.
 * Now simplified to only require a property address.
 */
import { DealAnalyzerInputSchema } from '@/ai/flows/types';
export type DealAnalyzerInput = z.infer<typeof DealAnalyzerInputSchema>;


/**
 * Defines the schema for the output of the deal analyzer flow.
 * It now includes the data fetched by the data agent.
 */
const DealAnalyzerOutputSchema = z.object({
  fetchedData: z.object({
    estimatedValue: z.number(),
    estimatedMonthlyRent: z.number(),
    estimatedMonthlyExpenses: z.number(),
  }).describe("The market data estimated by the AI data agent."),
  analysis: z.object({
    analysisSummary: z.string().describe("A narrative summary of the deal's viability, including a recommendation."),
    monthlyMortgagePayment: z.number().describe("The calculated principal and interest monthly mortgage payment."),
    monthlyCashFlow: z.number().describe("The estimated net cash flow per month."),
    cashOnCashROI: z.number().describe("The estimated cash-on-cash return on investment (annualized)."),
    capitalizationRate: z.number().describe("The estimated capitalization rate (cap rate)."),
    totalInitialInvestment: z.number().describe("The total cash required to close the deal (down payment + closing costs)."),
  }).describe("The detailed financial analysis of the deal.")
});
export type DealAnalyzerOutput = z.infer<typeof DealAnalyzerOutputSchema>;


// The "Data Agent" tool
const fetchMarketData = ai.defineTool(
    {
        name: 'fetchMarketData',
        description: 'Fetches estimated market data for a given property address, including value, rent, and expenses.',
        inputSchema: z.object({
            address: z.string(),
        }),
        outputSchema: z.object({
            estimatedValue: z.number().describe("The AI's estimated market value for the property."),
            estimatedMonthlyRent: z.number().describe("The AI's estimated average monthly rent for the area."),
            estimatedMonthlyExpenses: z.number().describe("The AI's estimated monthly expenses (taxes, insurance, HOA)."),
        })
    },
    async ({ address }) => {
        // In a real application, this would query a database or external API.
        // For now, we simulate this with plausible data based on the address.
        const hash = address.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
        const value = 2000000 + (hash % 100) * 10000;
        const rent = Math.round((value / 200) / 100) * 100;
        const expenses = Math.round((rent * 0.2) / 50) * 50;
        return {
            estimatedValue: value,
            estimatedMonthlyRent: rent,
            estimatedMonthlyExpenses: expenses,
        };
    }
);

const dealAnalyzerPrompt = ai.definePrompt({
  name: 'dealAnalyzerPrompt',
  tools: [fetchMarketData],
  input: { schema: z.object({
      propertyAddress: z.string(),
      purchasePrice: z.number(),
      downPaymentPercentage: z.number(),
      interestRate: z.number(),
      loanTermYears: z.number(),
      expectedMonthlyRent: z.number(),
      monthlyExpenses: z.number(),
      closingCosts: z.number(),
  })},
  output: { schema: DealAnalyzerOutputSchema.shape.analysis },
  prompt: `You are an expert real estate investment analyst. You have been provided with market data for a property. Analyze the following deal and provide a professional financial breakdown.

  **Property Details:**
  - Address: {{{propertyAddress}}}
  - Purchase Price: {{{purchasePrice}}}
  - Down Payment: {{{downPaymentPercentage}}}%
  - Interest Rate: {{{interestRate}}}%
  - Loan Term: {{{loanTermYears}}} years
  - Monthly Rent: {{{expectedMonthlyRent}}}
  - Monthly Expenses: {{{monthlyExpenses}}}
  - Closing Costs: {{{closingCosts}}}

  **Instructions:**

  1.  **Calculate the Down Payment Amount**: purchasePrice * (downPaymentPercentage / 100).
  2.  **Calculate the Loan Amount**: purchasePrice - Down Payment Amount.
  3.  **Calculate the Monthly Mortgage Payment (Principal & Interest)**: Use the standard formula. Let monthly interest rate 'r' = (interestRate / 100) / 12 and number of payments 'n' = loanTermYears * 12. The formula is: Loan Amount * [r(1+r)^n] / [(1+r)^n - 1].
  4.  **Calculate the Total Initial Investment**: Down Payment Amount + closingCosts.
  5.  **Calculate the Monthly Cash Flow**: expectedMonthlyRent - monthlyMortgagePayment - monthlyExpenses.
  6.  **Calculate the Annual Cash Flow**: monthlyCashFlow * 12.
  7.  **Calculate the Cash on Cash ROI**: (Annual Cash Flow / Total InitialInvestment) * 100.
  8.  **Calculate the Net Operating Income (NOI)**: (expectedMonthlyRent - monthlyExpenses) * 12.
  9.  **Calculate the Capitalization Rate (Cap Rate)**: (NOI / purchasePrice) * 100.

  10. **Write an Analysis Summary**: Based on your calculations, provide a professional, narrative summary. State whether the deal looks promising, marginal, or risky, and explain why, referencing the key metrics you calculated.
  
  Return all calculated values and the summary in the specified output format.
  `,
});

const dealAnalyzerFlow = ai.defineFlow(
  {
    name: 'dealAnalyzerFlow',
    inputSchema: DealAnalyzerInputSchema,
    outputSchema: DealAnalyzerOutputSchema,
  },
  async (input) => {
    // Stage 1: Call the Data Agent Tool
    const dataAgentResult = await fetchMarketData({ address: input.propertyAddress });

    // Stage 2: Call the analysis prompt with data from the agent
    const analysisInput = {
      propertyAddress: input.propertyAddress,
      purchasePrice: dataAgentResult.estimatedValue,
      downPaymentPercentage: 20, // Standard default
      interestRate: 4.5, // Standard default
      loanTermYears: 25, // Standard default
      expectedMonthlyRent: dataAgentResult.estimatedMonthlyRent,
      monthlyExpenses: dataAgentResult.estimatedMonthlyExpenses,
      closingCosts: dataAgentResult.estimatedValue * 0.04, // Standard 4% default
    };

    const { output } = await dealAnalyzerPrompt(analysisInput);
    
    if (!output) {
      throw new Error('The AI failed to analyze the deal.');
    }

    return {
      fetchedData: dataAgentResult,
      analysis: output
    };
  }
);

/**
 * An AI flow that analyzes a real estate deal.
 *
 * @param {DealAnalyzerInput} input - The input data for the deal.
 * @returns {Promise<DealAnalyzerOutput>} A promise that resolves with the deal analysis.
 */
export async function dealAnalyzer(
  input: DealAnalyzerInput
): Promise<DealAnalyzerOutput> {
  return dealAnalyzerFlow(input);
}
