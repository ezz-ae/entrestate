
'use server';

/**
 * @fileOverview An AI flow to edit a video for YouTube based on user instructions.
 *
 * This flow takes a source video, a set of instructions, and returns a new,
 * edited video ready for YouTube, now powered by the advanced Veo 3 model with sound.
 *
 * @export {function} editYoutubeVideo - The main function to edit a video.
 * @export {type} EditYouTubeVideoInput - The Zod schema for the input of the flow.
 * @export {type} EditYouTubeVideoOutput - The Zod schema for the output of the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

/**
 * Defines the schema for the input of the video editing flow.
 */
const EditYouTubeVideoInputSchema = z.object({
  sourceVideo: z
    .string()
    .describe(
      "The source video file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  editingInstructions: z
    .string()
    .describe('The general instructions for editing the video (e.g., style, music, goal).'),
  deepEditInstructions: z
    .string()
    .optional()
    .describe('Optional specific instructions for fine-tuning the video (e.g., timestamps, text overlays).'),
});
export type EditYouTubeVideoInput = z.infer<typeof EditYouTubeVideoInputSchema>;

/**
 * Defines the schema for the output of the video editing flow.
 */
const EditYouTubeVideoOutputSchema = z.object({
  editedVideoDataUri: z
    .string()
    .describe(
      "The edited video file, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type EditYouTubeVideoOutput = z.infer<typeof EditYouTubeVideoOutputSchema>;

/**
 * An AI flow that edits a video for YouTube based on user instructions.
 *
 * @param {EditYouTubeVideoInput} input - The input data for editing the video.
 * @returns {Promise<EditYouTubeVideoOutput>} A promise that resolves with the edited video data URI.
 */
export async function editYoutubeVideo(input: EditYouTubeVideoInput): Promise<EditYouTubeVideoOutput> {
  return editYoutubeVideoFlow(input);
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


const editYoutubeVideoFlow = ai.defineFlow(
  {
    name: 'editYoutubeVideoFlow',
    inputSchema: EditYouTubeVideoInputSchema,
    outputSchema: EditYouTubeVideoOutputSchema,
  },
  async (input) => {
    let { operation } = await ai.generate({
      model: googleAI.model('veo-3.0-generate-preview'),
      prompt: [
        { media: { url: input.sourceVideo } },
        { text: `You are an expert video editor. Edit this source video according to the following instructions to make it ready for YouTube. The final video should have sound that matches the visuals and instructions.

        General Instructions: ${input.editingInstructions}
        
        Specific Edits: ${input.deepEditInstructions || 'None'}
        
        Return the final edited video.` }
      ],
      config: {
        // Veo 3 uses a default duration of 8s and does not support custom durationSeconds
        aspectRatio: '16:9',
      }
    });

    if (!operation) throw new Error("Video editing process did not start correctly.");

    while(!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.checkOperation(operation);
    }
    
    if (operation.error) throw new Error(`Video editing failed: ${operation.error.message}`);
    
    const video = operation.output?.message?.content.find(p => !!p.media);
    if (!video || !video.media?.url) throw new Error("Edited video not found in operation result.");

    const videoDataUri = await getVideoDataUri(video.media.url);
    
    return {
        editedVideoDataUri: videoDataUri,
    };
  }
);
