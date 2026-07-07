
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { getUidFromRequest } from '@/lib/api-helpers';
import { checkRateLimit, tooMany } from '@/lib/whitelabel/rate-limit';

// Import all flow functions directly here
import { generateAdFromBrochure } from '@/ai/flows/meta-pilot/generate-ad-from-brochure';
import { generateLandingPage } from '@/ai/flows/content/generate-landing-page';
import { rebrandBrochure } from '@/ai/flows/content/rebrand-brochure';
import { generateSocialPost } from '@/ai/flows/content/generate-social-post';
import { suggestTargetingOptions } from '@/ai/flows/meta-pilot/suggest-targeting-options';
import { editPdf } from '@/ai/flows/content/edit-pdf';
import { matchInvestors } from '@/ai/flows/market-intelligence/match-investors';
import { aiBrandCreator } from '@/ai/flows/content/ai-brand-creator';
import { generateMarketReport } from '@/ai/flows/market-intelligence/generate-market-report';
import { getMarketTrends } from '@/ai/flows/market-intelligence/get-market-trends';
import { generateListing } from '@/ai/flows/listing-crm/generate-listing';
import { generateStory } from '@/ai/flows/content/generate-story';
import { generateReel } from '@/ai/flows/video/generate-reel';
import { generateTikTokVideo } from '@/ai/flows/video/generate-tiktok-video';
import { getCrmMemory } from '@/ai/flows/listing-crm/get-crm-memory';
import { manageSocialPage } from '@/ai/flows/meta-pilot/manage-social-page';
import { generateMultiOffer } from '@/ai/flows/market-intelligence/generate-multi-offer';
import { createEmailCampaign } from '@/ai/flows/meta-pilot/create-email-campaign';
import { manageWhatsAppCampaign } from '@/ai/flows/listing-crm/manage-whatsapp-campaign';
import { createMetaCampaign } from '@/ai/flows/meta-pilot/create-meta-campaign';
import { syncPropertyFinderListing } from '@/ai/flows/developer-backend/sync-property-finder-listing';
import { syncBayutListing } from '@/ai/flows/developer-backend/sync-bayut-listing';
import { generatePaymentPlan } from '@/ai/flows/listing-crm/generate-payment-plan';
import { translateBrochure } from '@/ai/flows/content/translate-brochure';
import { editYoutubeVideo } from '@/ai/flows/video/edit-youtube-video';
import { investigateLead } from '@/ai/flows/listing-crm/investigate-lead';
import { generateKeywordPlan } from '@/ai/flows/market-intelligence/generate-keyword-plan';
import { generateVideoPresenter } from '@/ai/flows/video/generate-video-presenter';
import { dealAnalyzer } from '@/ai/flows/market-intelligence/deal-analyzer';
import { ugcScriptWriter } from '@/ai/flows/content/ugc-script-writer';
import { leaseReviewerFlow } from '@/ai/flows/utility/lease-reviewer';
import { chatbotCreatorFlow } from '@/ai/flows/utility/chatbot-creator';
import { runMetaAutoPilot } from '@/ai/flows/meta-pilot/meta-auto-pilot';
import { getPaypalTransaction } from '@/ai/flows/developer-backend/get-paypal-transaction';
import { commissionCalculator } from '@/ai/flows/sales/commission-calculator';
import { scanForAlloyDB } from '@/ai/flows/developer-backend/scan-for-alloydb';
import { smartInputRouter } from '@/ai/flows/utility/smart-input-router';
import { dealsSmartPlanner } from '@/ai/flows/sales/deals-smart-planner';
import { rewriteSalesMessage } from '@/ai/flows/sales/rewrite-sales-message';

const runToolSchema = z.object({
  toolId: z.string(),
  payload: z.any(),
});


const flowRunnerMap: { [key: string]: (payload: any) => Promise<any> } = {
    'meta-auto-pilot': runMetaAutoPilot,
    'campaign-builder': createMetaCampaign,
    'audience-creator': suggestTargetingOptions,
    'insta-ads-designer': generateAdFromBrochure,
    'reel-ads': generateReel,
    'instagram-admin-ai': manageSocialPage,
    'story-planner': generateStory,
    'ai-video-presenter': generateVideoPresenter,
    'ugc-script-writer': ugcScriptWriter,
    'youtube-video-editor': editYoutubeVideo,
    'landing-pages': generateLandingPage,
    'rebranding': rebrandBrochure,
    'brochure-translator': translateBrochure,
    'pdf-editor-ai': editPdf,
    'images-hq-ai': generateAdFromBrochure,
    'logo-creator-ai': generateAdFromBrochure,
    'aerial-view-generator': generateReel, // Uses a similar video generation flow
    'listing-manager': (payload) => Promise.resolve({ error: "Listing Manager is a UI-driven tool, not a direct flow." }),
    'listing-performance': (payload) => Promise.resolve({ error: "Listing Performance is a UI-driven tool." }),
    'listing-generator': generateListing,
    'propertyfinder-sync': syncPropertyFinderListing,
    'bayut-sync': syncBayutListing,
    'deal-analyzer': dealAnalyzer,
    'commission-calculator': commissionCalculator,
    'payment-planner': generatePaymentPlan,
    'investor-matching': matchInvestors,
    'multi-offer-builder': generateMultiOffer,
    'whatsapp-manager': manageWhatsAppCampaign,
    'lead-investigator': investigateLead,
    'projects-finder': (payload) => Promise.resolve({ error: "Projects Finder is a UI-driven search tool." }),
    'market-reports': generateMarketReport,
    'market-trends': getMarketTrends,
    'ai-brand-creator': aiBrandCreator,
    'crm-assistant': getCrmMemory,
    'ai-assistant': (payload) => Promise.resolve({ error: "The AI Assistant is handled via the /api/chat endpoint." }),
    'chatbot-creator': chatbotCreatorFlow,
    'vm-creator': (payload) => Promise.resolve({ error: "This is a placeholder dev tool." }),
    'creative-execution-terminal': (payload) => Promise.resolve({ error: "This is a placeholder dev tool." }),
    'paypal-transaction': getPaypalTransaction,
    'keyword-planner': generateKeywordPlan,
    'alloydb-scanner': scanForAlloyDB,
    'lease-reviewer': leaseReviewerFlow,
    'prompt-library': (payload) => Promise.resolve({ message: "Executed from library", payload }),
    'smart-input-router': smartInputRouter,
    'deals-smart-planner': dealsSmartPlanner,
    'sales-message-rewriter': rewriteSalesMessage,
};

// Map of tool IDs to their suggested next action
const nextActionMap: Record<string, { toolId: string; title: string; description: string; }> = {
    'listing-generator': {
        toolId: 'listing-manager',
        title: 'Prepare for Publishing',
        description: 'Your listing is ready. Would you like to manage its assets and syndicate it to portals?',
    },
    'landing-pages': {
        toolId: 'campaign-builder',
        title: 'Drive Traffic',
        description: 'Your landing page is live. Let\'s create an ad campaign to drive traffic to it.',
    },
    'rebranding': {
        toolId: 'insta-ads-designer',
        title: 'Create an Ad',
        description: 'Your brochure is rebranded. Now, let\'s create a stunning ad with your new brand identity.',
    }
};


export async function POST(req: NextRequest) {
  // This endpoint dispatches ~50 server-side AI flows; it must never be public.
  const uid = await getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rl = await checkRateLimit(`run:uid:${uid}`, 60, 600); // 60 flow runs / 10 min / user
  if (!rl.allowed) return tooMany(rl.retryAfterSec);

  let body;
  try {
    body = await req.json();
    const validation = runToolSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.formErrors }, { status: 400 });
    }

    const { toolId, payload } = validation.data;
    
    const runner = flowRunnerMap[toolId];
    if (!runner) {
      return NextResponse.json({ error: `Tool with id "${toolId}" not found. Check the 'flowRunnerMap' in /api/run/route.ts.` }, { status: 404 });
    }

    const result = await runner(payload);
    
    // Check if there is a suggested next action for this tool
    const next_action = nextActionMap[toolId] || null;

    return NextResponse.json({ ...result, next_action });

  } catch (e: any) {
    const errorMessage = e.message || 'An unexpected error occurred.';
    const toolIdMessage = body?.toolId ? ` in tool ${body.toolId}` : '';
    console.error(`Error running tool${toolIdMessage}: ${errorMessage}`, e);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
