
'use client';

import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { GitFork, Check, ListTodo, Rocket } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const roadmapItems = {
    'In Progress': [
        { title: "Public API for Developers", description: "Allow third-party developers to build on the Entrestate platform." },
        { title: "AI-Powered Video Dubbing", description: "Translate and dub video content into multiple languages automatically." },
    ],
    'Planned': [
        { title: "Advanced CRM Integrations", description: "Two-way sync with popular CRMs like Salesforce and HubSpot." },
        { title: "Automated Ad Budget Allocation", description: "AI will suggest and manage budgets across campaigns based on performance." },
        { title: "Interactive 3D Property Tours", description: "Generate and embed interactive 3D tours from floor plans." },
    ],
    'Completed': [
        { title: "AI Voice Landing Pages", description: "Create an AI voice-call landing page for any listing, publish it, and capture leads into your CRM." },
        { title: "Intelligent Discover Engine", description: "The core search is now powered by a reasoning AI model." },
        { title: "User Authentication & Onboarding Flow", description: "Complete user registration and a guided setup experience." },
    ],
};

export default function RoadmapPage() {
  return (
    <div className="flex flex-col">
      <PageHeader
        title="Product Roadmap"
        description="See what we're building next and help shape the future of real estate intelligence."
        icon={<GitFork className="h-8 w-8" />}
      />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <Rocket className="h-6 w-6 text-blue-500" />
                    <h2 className="text-2xl font-bold font-heading">In Progress</h2>
                </div>
                 {roadmapItems['In Progress'].map(item => (
                    <Card key={item.title}><CardContent className="p-4"><p className="font-semibold">{item.title}</p><p className="text-sm text-muted-foreground">{item.description}</p></CardContent></Card>
                 ))}
            </div>
            <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <ListTodo className="h-6 w-6 text-purple-500" />
                    <h2 className="text-2xl font-bold font-heading">Planned</h2>
                </div>
                 {roadmapItems['Planned'].map(item => (
                    <Card key={item.title}><CardContent className="p-4"><p className="font-semibold">{item.title}</p><p className="text-sm text-muted-foreground">{item.description}</p></CardContent></Card>
                 ))}
            </div>
             <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <Check className="h-6 w-6 text-green-500" />
                    <h2 className="text-2xl font-bold font-heading">Completed</h2>
                </div>
                 {roadmapItems['Completed'].map(item => (
                    <Card key={item.title} className="bg-muted/50"><CardContent className="p-4"><p className="font-semibold">{item.title}</p><p className="text-sm text-muted-foreground">{item.description}</p></CardContent></Card>
                 ))}
            </div>
        </div>
      </main>
    </div>
  );
}
