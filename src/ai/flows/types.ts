
import { z } from 'zod';

// Schemas for Audience Creator (`suggest-targeting-options`)
export const SuggestTargetingOptionsInputSchema = z.object({
  projectId: z.string().describe('The project ID to generate targeting for.'),
});
export const SuggestTargetingOptionsOutputSchema = z.object({
  strategies: z.array(z.object({
    strategyName: z.string().describe("The name of the targeting strategy (e.g., 'The Local Professional')."),
    audienceType: z.string().describe("The type of Meta audience to create (e.g., 'Detailed Targeting', 'Lookalike Audience')."),
    demographics: z.string().describe("The demographic targeting parameters (e.g., 'Age: 30-45, Location: Downtown Dubai')."),
    interests: z.string().describe("The interest-based targeting for platforms like Facebook/Instagram."),
    keywords: z.string().describe("The keyword targeting for platforms like Google Ads."),
  })).describe("A list of 2-3 distinct targeting strategies."),
});
export type SuggestTargetingOptionsInput = z.infer<typeof SuggestTargetingOptionsInputSchema>;
export type SuggestTargetingOptionsOutput = z.infer<typeof SuggestTargetingOptionsOutputSchema>;


// Schemas for Ad Creative Generation (`generate-ad-from-brochure`)
export const GenerateAdFromBrochureOutputSchema = z.object({
  adCopy: z.string().describe('The generated ad copy.'),
  adDesign: z.string().describe('The data URI of the generated ad design.'),
  landingPage: z.string().describe('The data URI of the generated landing page.'),
});
export type GenerateAdFromBrochureOutput = z.infer<typeof GenerateAdFromBrochureOutputSchema>;

// Schemas for Meta Ads Co-Pilot (`create-meta-campaign`)
export const CreateMetaCampaignInputSchema = z.object({
  campaignGoal: z.string().describe("The user's primary objective for the campaign. e.g. 'Lead Generation to Landing Page'"),
  projectBrochureDataUri: z.string().optional().describe("The project brochure as a data URI."),
  budget: z.number().describe("The total ad spend budget."),
  durationDays: z.number().describe("The campaign duration in days."),
});
export const CreateMetaCampaignOutputSchema = z.object({
    publishedCampaignId: z.string().describe("A dummy ID confirming the plan is ready. Always 'campaign-not-published'."),
    campaignName: z.string().describe("The AI-generated name for the campaign."),
    campaignObjective: z.string().describe("The recommended Meta Ads objective (e.g., 'LEAD_GENERATION')."),
    inferredAudience: z.string().describe("A description of the target audience inferred by the AI."),
    adSets: z.array(z.object({
        name: z.string().describe("The name of the ad set."),
        targetingSummary: z.string().describe("A summary of the targeting strategy for this set."),
        dailyBudget: z.number().describe("The calculated daily budget for this ad set."),
    })).describe("A list of ad sets for the campaign."),
    adCreatives: z.array(z.object({
        headline: z.string().describe("The ad headline."),
        bodyText: z.string().describe("The ad's primary text/body."),
        callToAction: z.string().describe("The suggested call-to-action button text."),
        imageSuggestion: z.string().describe("A detailed suggestion for the ad's visual creative."),
    })).describe("A list of ad creative variations to test."),
    optimizationAdvice: z.string().describe("A key piece of advice for running the campaign."),
});
export type CreateMetaCampaignInput = z.infer<typeof CreateMetaCampaignInputSchema>;
export type CreateMetaCampaignOutput = z.infer<typeof CreateMetaCampaignOutputSchema>;


// Schemas for Lead Investigator AI (`investigate-lead`)
export const InvestigateLeadInputSchema = z.object({
  name: z.string().describe('The full name of the lead.'),
  company: z.string().optional().describe('The company the lead works for.'),
  email: z.string().email().optional().describe('The email address of the lead.'),
  location: z.string().optional().describe('The city or country of the lead.'),
  role: z.string().optional().describe('The job title or role of the lead.'),
});

const LeadMatchSchema = z.object({
  name: z.string().describe('The name of the matched person.'),
  source: z.string().describe('The platform where the match was found (e.g., LinkedIn, Facebook, Company Website).'),
  profileUrl: z.string().url().describe('The URL to the profile or source page.'),
  summary: z.string().describe('A brief summary of why this might be the lead (e.g., "CEO at ACME Inc, based in Dubai").'),
  matchConfidence: z.number().min(0).max(1).describe('The AI\'s confidence that this is the correct person (0 to 1).'),
});

export const InvestigateLeadOutputSchema = z.object({
  matches: z.array(LeadMatchSchema).describe('A list of potential matches found for the lead.'),
  overallSummary: z.string().describe('A high-level summary of the investigation findings.'),
});

export type InvestigateLeadInput = z.infer<typeof InvestigateLeadInputSchema>;
export type InvestigateLeadOutput = z.infer<typeof InvestigateLeadOutputSchema>;


// Schemas for AI Video Presenter (`generate-video-presenter`)
export const GenerateVideoPresenterInputSchema = z.object({
  characterImageUri: z.string().optional().describe("A data URI of the user's photo to create a digital twin. This is the primary input for the presenter's appearance."),
  characterDescription: z.string().optional().describe("A text description to generate a new character image if no photo is uploaded."),
  script: z.string().describe("The script for the presenter to speak."),
});
export const GenerateVideoPresenterOutputSchema = z.object({
  videoUrl: z.string().describe("A data URI of the generated presenter video."),
  audioDataUri: z.string().describe("A data URI of the generated speech audio in WAV format."),
});
export type GenerateVideoPresenterInput = z.infer<typeof GenerateVideoPresenterInputSchema>;
export type GenerateVideoPresenterOutput = z.infer<typeof GenerateVideoPresenterOutputSchema>;

// Schemas for Meta Auto Pilot (`meta-auto-pilot`)
export const MetaAutoPilotInputSchema = z.object({
  projectId: z.string().describe('The ID of the project for the campaign.'),
  campaignGoal: z.string().describe('The high-level goal of the campaign, e.g., "Lead Generation to Landing Page".'),
});
export const MetaAutoPilotOutputSchema = z.object({
  status: z.string(),
  finalCampaignId: z.string().optional(),
  audienceStrategy: SuggestTargetingOptionsOutputSchema.optional(),
  adCreative: GenerateAdFromBrochureOutputSchema.optional(),
  finalCampaignPlan: CreateMetaCampaignOutputSchema.optional(),
});
export type MetaAutoPilotInput = z.infer<typeof MetaAutoPilotInputSchema>;
export type MetaAutoPilotOutput = z.infer<typeof MetaAutoPilotOutputSchema>;

// Schema for Deal Analyzer (`deal-analyzer`) — lives here (not in the
// 'use server' flow module) so client forms can import it for validation.
export const DealAnalyzerInputSchema = z.object({
  propertyAddress: z.string().describe("The full address of the property to analyze."),
});
