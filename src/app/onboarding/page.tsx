'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

// Import step components
import { Step1_MarketFocus } from '@/components/onboarding/Step1_MarketFocus';
import { Step2_ProjectShortlist } from '@/components/onboarding/Step2_ProjectShortlist';
import { Step3_BrandKit } from '@/components/onboarding/Step3_BrandKit';
import { Step4_Connections } from '@/components/onboarding/Step4_Connections';
import type { OnboardingDraft } from '@/types';
import { fileToDataUri } from '@/lib/file-utils';

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<OnboardingDraft>({
      devFocus: [],
      shortlist: [],
      brandKit: { contact: { name: '', email: '' } },
      connections: { meta: false, google: false },
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const updateDraft = (data: Partial<OnboardingDraft>) => {
    setDraft(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));
  
  const handleFinish = async () => {
    if (!user) {
        toast({ title: "Authentication Error", description: "You must be logged in to complete onboarding.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    toast({ title: "Setting up your workspace..."});

    try {
        let logoUrl: string | null = null;
        if (logoFile) {
            // In a real app, this would upload to Firebase Storage and get the URL
            logoUrl = await fileToDataUri(logoFile); // Using data URI as a placeholder
        }
        
        const finalData = {
            companyName: draft.brandKit?.contact?.name,
            brandKit: {
                ...draft.brandKit,
                logoUrl: logoUrl,
            },
            onboarding: {
                ...draft,
                progress: { step: TOTAL_STEPS, ts: Date.now() },
            }
        };

        // Persist via the authenticated API (uid derived from the verified token).
        const saveToken = await user.getIdToken();
        const saveRes = await fetch('/api/user/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${saveToken}` },
            body: JSON.stringify(finalData),
        });
        if (!saveRes.ok) throw new Error('Failed to save your workspace. Please try again.');

        // Add shortlisted projects to user's library
        if (draft.shortlist && draft.suggestedProjects) {
            const projectsToAdd = draft.suggestedProjects.filter(p => draft.shortlist?.includes(p.id));
            const idToken = await user.getIdToken();
            for (const project of projectsToAdd) {
                 await fetch('/api/user/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                    body: JSON.stringify(project)
                });
            }
        }
        
        toast({ title: "Workspace Ready!", description: "Welcome to Entrestate. You are being redirected." });
        router.push('/me/workspace');

    } catch (e: any) {
        toast({ title: "Setup Failed", description: e.message, variant: "destructive" });
        setIsSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-8">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-heading">Setup Your AI Workspace</h1>
          <p className="text-muted-foreground">Let's personalize your experience. This will take about 2 minutes.</p>
        </div>

        <Progress value={(step / TOTAL_STEPS) * 100} className="w-full" />

        <div className="min-h-[300px]">
            {step === 1 && <Step1_MarketFocus draft={draft} updateDraft={updateDraft} />}
            {step === 2 && <Step2_ProjectShortlist draft={draft} updateDraft={updateDraft} />}
            {step === 3 && <Step3_BrandKit draft={draft} updateDraft={updateDraft} onFileSelect={setLogoFile} />}
            {step === 4 && <Step4_Connections draft={draft} updateDraft={updateDraft} />}
        </div>
        
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={prevStep} disabled={step === 1 || isSaving}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          {step < TOTAL_STEPS ? (
            <Button onClick={nextStep} disabled={isSaving}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Finish Setup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
