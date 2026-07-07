
'use server';

/**
 * @fileOverview An AI flow to generate a video reel from project assets with auto-captions.
 *
 * This flow takes project assets and key selling points to create a short-form
 * video reel with dynamic captions and trending audio.
 *
 * @export {function} generateReel - The main function to generate a reel.
 * @export {type} GenerateReelInput - The Zod schema for the input of the generateReel flow.
 * @export {type} GenerateReelOutput - The Zod schema for the output of the generateReel flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

/**
 * Defines the schema for the input of the reel generation flow.
 */
const GenerateReelInputSchema = z.object({
  projectId: z.string().describe('The ID of the project to use for assets. In a real app, you would use this to fetch images.'),
  sellingPoints: z.string().describe('Key selling points for text overlays, separated by newlines.'),
  vibe: z.string().describe('The desired vibe for the reel, influencing music and editing style.'),
});
export type GenerateReelInput = z.infer<typeof GenerateReelInputSchema>;

/**
 * Defines the schema for the output of the reel generation flow.
 */
const GenerateReelOutputSchema = z.object({
  reelVideoDataUri: z
    .string()
    .describe(
      "The generated reel video, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateReelOutput = z.infer<typeof GenerateReelOutputSchema>;


/**
 * An AI flow that generates a video reel.
 *
 * @param {GenerateReelInput} input - The input data for generating the reel.
 * @returns {Promise<GenerateReelOutput>} A promise that resolves with the generated reel data.
 */
export async function generateReel(input: GenerateReelInput): Promise<GenerateReelOutput> {
  return generateReelFlow(input);
}

// Helper to fetch and encode the video
async function getVideoDataUri(videoUrl: string): Promise<string> {
    const fetch = (await import('node-fetch')).default;
    const apiKey = process.env.GEMINI_API_KEY || process.env.VERTEX_AI_API_KEY;
    if (!apiKey) throw new Error("API key is missing.");

    const videoDownloadResponse = await fetch(`${videoUrl}&key=${apiKey}`);
    if (!videoDownloadResponse.ok) {
        throw new Error(`Failed to download video: ${videoDownloadResponse.statusText}`);
    }
    const videoBuffer = await videoDownloadResponse.arrayBuffer();
    return `data:video/mp4;base64,${Buffer.from(videoBuffer).toString('base64')}`;
}


const generateReelFlow = ai.defineFlow(
  {
    name: 'generateReelFlow',
    inputSchema: GenerateReelInputSchema,
    outputSchema: GenerateReelOutputSchema,
  },
  async (input) => {
    // In a real app, you would fetch real project assets here.
    let { operation } = await ai.generate({
      model: googleAI.model('veo-2.0-generate-001'),
      prompt: `Create a modern, fast-paced Instagram Reel for a real estate project. The video should be vertical (9:16) and around 15-30 seconds long.
      
      Vibe: ${input.vibe}
      Key Selling Points (as text overlays): ${input.sellingPoints}

      Use quick cuts of high-quality, photorealistic shots of a modern luxury apartment interior and exterior. Include dynamic transitions and engaging text animations for the selling points.
      `,
      config: {
        aspectRatio: '9:16',
      }
    });

    if (!operation) throw new Error("Video generation did not return an operation.");

    while(!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.checkOperation(operation);
    }
    
    if (operation.error) throw new Error(`Video generation failed: ${operation.error.message}`);
    
    const video = operation.output?.message?.content.find(p => !!p.media);
    if (!video || !video.media?.url) throw new Error("Generated video not found in operation result.");

    const videoDataUri = await getVideoDataUri(video.media.url);
    
    return {
      reelVideoDataUri: videoDataUri,
    };
  }
);
