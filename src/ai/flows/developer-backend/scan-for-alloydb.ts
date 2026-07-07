'use server';

/**
 * @fileOverview An AI flow to scan for databases and analyze their suitability for migration to AlloyDB.
 *
 * This flow acts as a database assessment tool, taking a configuration context
 * and generating a report on potential AlloyDB migration candidates.
 *
 * @module AI/Flows/ScanForAlloyDB
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

/**
 * Defines the schema for the input of the AlloyDB scanner flow.
 */
const ScanForAlloyDBInputSchema = z.object({
  scanContext: z.string().describe('A description of the environment to scan, such as project details, IP ranges, or existing database types.'),
});
export type ScanForAlloyDBInput = z.infer<typeof ScanForAlloyDBInputSchema>;

const DatabaseInstanceSchema = z.object({
    name: z.string().describe('The name or identifier of the detected database instance.'),
    type: z.string().describe('The type of the database (e.g., PostgreSQL, MySQL, SQL Server).'),
    version: z.string().describe('The version of the database software.'),
    isAlloyDBCompatible: z.boolean().describe('Whether this database is a direct candidate for AlloyDB migration.'),
    recommendation: z.string().describe('A recommendation for this instance (e.g., "Good candidate for migration," "Requires schema changes").'),
});

/**
 * Defines the schema for the output of the AlloyDB scanner flow.
 */
const ScanForAlloyDBOutputSchema = z.object({
  summary: z.string().describe('A high-level summary of the scan results.'),
  instances: z.array(DatabaseInstanceSchema).describe('A list of detected database instances and their analysis.'),
});
export type ScanForAlloyDBOutput = z.infer<typeof ScanForAlloyDBOutputSchema>;


const scanForAlloyDBPrompt = ai.definePrompt({
  name: 'scanForAlloyDBPrompt',
  input: {schema: ScanForAlloyDBInputSchema},
  output: {schema: ScanForAlloyDBOutputSchema},
  prompt: `You are an expert Google Cloud database specialist. Your knowledge is based on the "Scanning for AlloyDB" whitepaper. Your task is to analyze a user's environment to find databases suitable for migration to AlloyDB for PostgreSQL.

  **Scan Context:**
  "{{{scanContext}}}"

  **Instructions:**

  1.  **Simulate a Scan:** Based on the user's context, simulate the discovery of 2-4 database instances. Include some PostgreSQL databases (which are compatible) and some other types (like MySQL or SQL Server).
  2.  **Analyze Compatibility:** For each discovered instance, determine if it is compatible with AlloyDB for PostgreSQL.
  3.  **Provide Recommendations:** For each instance, provide a clear recommendation. For compatible databases, suggest migration. For others, explain why they are not direct candidates.
  4.  **Write a Summary:** Provide a high-level summary of your findings and the overall potential for AlloyDB migration in this environment.

  Return the results in the specified JSON format.
  `,
});


const scanForAlloyDBFlow = ai.defineFlow(
  {
    name: 'scanForAlloyDBFlow',
    inputSchema: ScanForAlloyDBInputSchema,
    outputSchema: ScanForAlloyDBOutputSchema,
  },
  async input => {
    const {output} = await scanForAlloyDBPrompt(input);
    if (!output) {
      throw new Error('The AI failed to perform the AlloyDB scan.');
    }
    return output;
  }
);


/**
 * An AI flow that scans for databases and analyzes them for AlloyDB migration.
 *
 * @param {ScanForAlloyDBInput} input - The input data for the scan.
 * @returns {Promise<ScanForAlloyDBOutput>} A promise that resolves with the scan results.
 */
export async function scanForAlloyDB(
  input: ScanForAlloyDBInput
): Promise<ScanForAlloyDBOutput> {
  return scanForAlloyDBFlow(input);
}
