
'use client';

import React, { Suspense, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Wallet } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { PricingCard } from '@/components/pricing-card';
import { pricingData } from '@/lib/pricing-data';
import { ClaimBanner } from '@/components/claim-banner';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const plans = pricingData.plans;

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
        <Suspense fallback={null}>
          <ClaimBanner />
        </Suspense>
        <PageHeader
          title="Plans & Pricing"
          description="Choose the perfect suite for your real estate ambitions. From solo agents to large-scale developers."
          icon={<Wallet className="h-8 w-8" />}
        />
        <div className="flex justify-center items-center gap-4 my-12">
          <span className={cn(!isAnnual ? 'text-foreground' : 'text-muted-foreground', 'font-medium')}>Pay Monthly</span>
          <Switch checked={isAnnual} onCheckedChange={setIsAnnual} aria-label="Toggle billing frequency" />
          <span className={cn(isAnnual ? 'text-foreground' : 'text-muted-foreground', 'font-medium')}>
            Pay Annually <span className="text-primary font-semibold">(-20%)</span>
          </span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} isAnnual={isAnnual} />
            ))}
        </div>
        
      </main>
    </div>
  );
}
