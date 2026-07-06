
'use server';

/**
 * @fileOverview An AI flow to generate a plan for editing PDF documents based on user instructions.
 *
 * This flow takes a source PDF, a set of instructions, and optional new images,
 * and returns a structured execution plan. This plan can then be passed to an
 * "Execution Terminal" to perform the actual edits. This flow acts as a "Planner".
 *
 * @export {function} editPdf - The main function to create a PDF editing plan.
 * @export {type} EditPdfInput - The Zod schema for the input of the editPdf flow.
 * @export {type} EditPdfOutput - The Zod schema for the output of the editPdf flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * Defines the schema for the input of the PDF editing flow.
 */
const EditPdfInputSchema = z.object({
  /**
   * The source PDF document, encoded as a Base64 data URI.
   * @example "data:application/pdf;base64,..."
   */
  sourcePdf: z
    .string()
    .describe(
      "The source PDF document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  /**
   * Plain-text instructions describing the edits to be made.
   */
  editInstructions: z
    .string()
    .describe('The instructions for editing the PDF.'),
  /**
   * Optional new images to be used in the edited PDF, encoded as Base64 data URIs.
   */
  newImages: z
    .array(z.string())
    .optional()
    .describe(
      "An optional array of new images to be used, as data URIs. Expected format: 'data:<mimetype>;base64,<encoded_data>'. Only provide if your instructions reference replacing an image."
    ),
});
export type EditPdfInput = z.infer<typeof EditPdfInputSchema>;

/**
 * Defines the schema for a single step in the execution plan.
 */
const ExecutionStepSchema = z.object({
    description: z.string().describe("A human-readable description of the step."),
    tool: z.string().describe("The name of the tool or API to be called."),
    parameters: z.any().describe("The parameters to be passed to the tool."),
});

/**
 * Defines the schema for the output of the PDF editing plan generation flow.
 */
const EditPdfOutputSchema = z.object({
  /**
   * A human-readable summary of the plan.
   */
  summary: z.string().describe("A brief summary of the planned edits."),
  /**
   * The structured execution plan.
   */
  executionPlan: z.array(ExecutionStepSchema).describe("An array of steps to be executed."),
});
export type EditPdfOutput = z.infer<typeof EditPdfOutputSchema>;


/**
 * An AI flow that creates a plan for editing a PDF based on user instructions.
 *
 * @param {EditPdfInput} input - The input data for editing the PDF.
 * @returns {Promise<EditPdfOutput>} A promise that resolves with the execution plan.
 */
export async function editPdf(input: EditPdfInput): Promise<EditPdfOutput> {
  return editPdfFlow(input);
}

const editPdfPrompt = ai.definePrompt({
  name: 'editPdfPlannerPrompt',
  input: {schema: EditPdfInputSchema},
  output: {schema: EditPdfOutputSchema},
  prompt: `You are an expert document editing planner. Your task is to analyze user instructions and generate a structured execution plan for editing a PDF. Do not perform the edit yourself.

  Source PDF: {{media url=sourcePdf}}

  Editing Instructions:
  {{{editInstructions}}}

  {{#if newImages}}
  New Images to use:
  {{#each newImages}}
  - Image {{add @index 1}}: Available for use.
  {{/each}}
  {{/if}}

  Analyze the instructions and break them down into a series of steps. For each step, provide a description, the tool needed (e.g., 'text.replace', 'image.swap', 'layout.adjust'), and the necessary parameters.

  Example Plan:
  - Step 1: Replace text on page 2. Tool: 'text.replace', Params: { page: 2, old: 'AED 2.4M', new: 'AED 2.5M' }
  - Step 2: Swap image on page 1. Tool: 'image.swap', Params: { page: 1, targetImage: 'logo.png', newImage: 'Image 1' }

  Provide a human-readable summary and the detailed executionPlan array.
  `,
});

const editPdfFlow = ai.defineFlow(
  {
    name: 'editPdfFlow',
    inputSchema: EditPdfInputSchema,
    outputSchema: EditPdfOutputSchema,
  },
  async input => {
    const {output} = await editPdfPrompt(input);
    if (!output) {
      throw new Error("Failed to generate an editing plan.");
    }
    return output;
  }
);
