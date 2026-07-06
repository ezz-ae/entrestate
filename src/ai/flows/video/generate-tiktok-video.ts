
'use server';

/**
 * @fileOverview An AI flow to generate a TikTok-style video.
 *
 * This flow creates a short, engaging, on-trend video clip ready for TikTok,
 * using project assets and syncing to trending audio styles.
 *
 * @export {function} generateTikTokVideo - The main function to generate a TikTok video.
 * @export {type} GenerateTikTokVideoInput - The Zod schema for the input.
 * @export {type} GenerateTikTokVideoOutput - The Zod schema for the output.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

/**
 * Defines the schema for the input of the TikTok video generation flow.
 */
const GenerateTikTokVideoInputSchema = z.object({
  projectId: z.string().describe('The ID of the project to use for visual assets.'),
  sound: z.string().describe('The trending sound or vibe to use for the video.'),
  textOverlays: z.string().describe('Engaging text to overlay on the video, separated by newlines.'),
});
export type GenerateTikTokVideoInput = z.infer<typeof GenerateTikTokVideoInputSchema>;

/**
 * Defines the schema for the output of the TikTok video generation flow.
 */
const GenerateTikTokVideoOutputSchema = z.object({
  tiktokVideoDataUri: z
    .string()
    .describe(
      "The generated TikTok video, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateTikTokVideoOutput = z.infer<typeof GenerateTikTokVideoOutputSchema>;


/**
 * An AI flow that generates a TikTok video.
 *
 * @param {GenerateTikTokVideoInput} input - The input data for the video.
 * @returns {Promise<GenerateTikTokVideoOutput>} A promise that resolves with the video data.
 */
export async function generateTikTokVideo(input: GenerateTikTokVideoInput): Promise<GenerateTikTokVideoOutput> {
  return generateTikTokVideoFlow(input);
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

const generateTikTokVideoFlow = ai.defineFlow(
  {
    name: 'generateTikTokVideoFlow',
    inputSchema: GenerateTikTokVideoInputSchema,
    outputSchema: GenerateTikTokVideoOutputSchema,
  },
  async (input) => {
    // In a real app, you would fetch real project assets here.
     let { operation } = await ai.generate({
      model: googleAI.model('veo-2.0-generate-001'),
      prompt: `Create a TikTok-style video for a real estate project. The video must be vertical (9:16) and no longer than 20 seconds.
      
      Project: ${input.projectId}
      Audio Vibe: ${input.sound}
      Text Overlays (one per scene):
      ${input.textOverlays}

      The video should use fast cuts of photorealistic shots of a luxury villa, punchy text animations that appear on screen with the beat, and have a modern, authentic feel.
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
      tiktokVideoDataUri: videoDataUri,
    };
  }
);
