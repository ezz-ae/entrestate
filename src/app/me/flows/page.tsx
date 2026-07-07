
'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Workflow, Plus, Play, Sparkles, ArrowRight, CheckCircle, ExternalLink, Settings2, Save, Zap, GripVertical, MousePointerClick, GitBranch, AlertCircle, Sparkle, Mail, MessageSquare, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { tools, Feature } from '@/lib/tools-client';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Reorder } from 'framer-motion';
import { Separator }from '@/components/ui/separator';

type StepType = 'trigger' | 'action' | 'condition' | 'event';

interface FlowStep {
    id: string;
    type: StepType;
    appId: string | null;
    appName: string;
    appDescription: string;
    appIcon?: React.ReactNode;
    appColor?: string;
}

const AppSelectionModal = ({ onSelectApp, installedApps }: { onSelectApp: (app: Feature) => void, installedApps: Feature[] }) => {
    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Select an App</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-4 py-4 max-h-[60vh] overflow-y-auto">
                {installedApps.map(app => (
                    <DialogTrigger asChild key={app.id}>
                        <button onClick={() => onSelectApp(app)} className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted transition-colors text-center">
                             <div className="p-3 rounded-lg text-white w-fit" style={{ backgroundColor: app.color }}>
                                {React.cloneElement(app.icon, { className: 'h-6 w-6' })}
                            </div>
                            <p className="text-xs font-medium truncate w-24">{app.title}</p>
                        </button>
                    </DialogTrigger>
                ))}
            </div>
        </DialogContent>
    );
}

const getIconForType = (type: StepType) => {
    switch (type) {
        case 'trigger': return <Zap className="h-6 w-6 text-amber-500" />;
        case 'action': return <Sparkles className="h-6 w-6 text-blue-500" />;
        case 'condition': return <GitBranch className="h-6 w-6 text-purple-500" />;
        default: return <MousePointerClick className="h-6 w-6 text-muted-foreground" />;
    }
}


export default function FlowsPage() {
  const [installedApps, setInstalledApps] = useState<Feature[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [currentFlow, setCurrentFlow] = useState<FlowStep[]>([]);
  const { toast } = useToast();
  const [stepToUpdate, setStepToUpdate] = useState<string | null>(null);


  useEffect(() => {
    setIsClient(true);
    try {
        const savedAppIds = JSON.parse(localStorage.getItem('addedApps') || '[]');
        const userApps = tools.filter(tool => savedAppIds.includes(tool.id));
        setInstalledApps(userApps);
    } catch(e) {
        // Handle cases where localStorage is not available.
    }
  }, []);

  const handleAddStep = (type: StepType) => {
      const newStep: FlowStep = {
          id: `${type}-${Date.now()}`,
          type,
          appId: null,
          appName: `Select ${type}`,
          appDescription: `Choose an app to perform this ${type}.`,
          appIcon: getIconForType(type),
          appColor: 'hsl(var(--muted))',
      };
      
      if (type === 'trigger' && currentFlow.some(s => s.type === 'trigger')) {
          toast({ title: "Trigger already exists", description: "A flow can only have one trigger. Replace the existing one by clicking on it.", variant: "destructive" });
          return;
      }
      
      const newFlow = type === 'trigger' ? [newStep, ...currentFlow.filter(s => s.type !== 'trigger')] : [...currentFlow, newStep];
      setCurrentFlow(newFlow);
      setStepToUpdate(newStep.id);
  }

  const handleSelectAppForStep = (stepId: string, app: Feature) => {
      setCurrentFlow(prev => prev.map(step => 
          step.id === stepId 
          ? { ...step, appId: app.id, appName: app.title, appDescription: app.description, appIcon: app.icon, appColor: app.color }
          : step
      ));
      setStepToUpdate(null);
  }
  
  const handleRunFlow = () => {
    if (currentFlow.length === 0 || currentFlow.some(step => !step.appId)) {
        toast({ title: "Incomplete Flow", description: "Please add at least one trigger and select an app for every step.", variant: "destructive"});
        return;
    }
    // The Flow Builder is a design surface today; execution is not yet wired.
    // Do not claim the automation is live — that would be false.
    toast({
      title: "Flow saved as a draft",
      description: "Automated execution is coming soon — we'll run your saved flows once the engine ships.",
    });
  }

  if (!isClient) {
      return null;
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Flow Builder"
        description="Create powerful, automated workflows by connecting your apps. Your flows run in the background, 24/7."
        icon={<Workflow className="h-6 w-6" />}
      >
        <div className="flex gap-2">
            <Button variant="outline"><Save className="mr-2 h-4 w-4" /> Save Flow</Button>
            <Button onClick={handleRunFlow}><Play className="mr-2 h-4 w-4"/> Activate Flow</Button>
        </div>
      </PageHeader>
      <div className="p-4 md:p-6 space-y-8">
        <Card className="w-full max-w-2xl mx-auto border-dashed">
            <CardContent className="p-6 md:p-10">
                <div className="flex flex-col items-center gap-0">
                    
                     {currentFlow.length === 0 ? (
                        <div className="text-center py-16">
                            <h3 className="text-lg font-semibold">Start building your automation</h3>
                            <p className="text-muted-foreground mb-4">Choose a trigger to kick things off.</p>
                             <Dialog>
                                <DialogTrigger asChild>
                                    <Button onClick={() => setStepToUpdate('new-trigger')}>
                                        <Plus className="mr-2 h-4 w-4" /> Add a Trigger
                                    </Button>
                                </DialogTrigger>
                                <AppSelectionModal installedApps={installedApps} onSelectApp={(app) => {
                                    const newStep: FlowStep = {
                                        id: `trigger-${Date.now()}`, type: 'trigger',
                                        appId: app.id, appName: app.title, appDescription: app.description, appIcon: app.icon, appColor: app.color
                                    };
                                    setCurrentFlow([newStep]);
                                }} />
                            </Dialog>
                        </div>
                    ) : (
                        <Reorder.Group axis="y" values={currentFlow} onReorder={setCurrentFlow} className="w-full max-w-md space-y-0">
                            {currentFlow.map((step, index) => (
                               <React.Fragment key={step.id}>
                                <Reorder.Item value={step}>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <div className="w-full text-left group cursor-pointer" onClick={() => setStepToUpdate(step.id)}>
                                                <Card 
                                                    className={cn("hover:border-primary/50 hover:shadow-lg transition-all relative z-10")}
                                                    style={{borderColor: step.appId ? step.appColor : undefined}}
                                                >
                                                    <CardHeader>
                                                        <CardTitle className="flex items-center gap-4">
                                                            <GripVertical className="h-5 w-5 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            <div 
                                                                className="p-3 rounded-lg text-white" 
                                                                style={{ backgroundColor: step.appColor || 'hsl(var(--muted))' }}
                                                            >
                                                              {step.appIcon || getIconForType(step.type)}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{step.type}</p>
                                                                <p className="text-xl font-semibold">{step.appName}</p>
                                                                <p className="text-xs text-muted-foreground">{step.appDescription}</p>
                                                            </div>
                                                        </CardTitle>
                                                    </CardHeader>
                                                </Card>
                                            </div>
                                        </DialogTrigger>
                                        {stepToUpdate === step.id && <AppSelectionModal installedApps={installedApps} onSelectApp={(app) => handleSelectAppForStep(step.id, app)} />}
                                    </Dialog>
                                </Reorder.Item>
                                {index < currentFlow.length -1 && (
                                    <div className="h-8 w-px bg-border my-1 self-center" />
                                )}
                               </React.Fragment>
                            ))}
                        </Reorder.Group>
                    )}

                    {currentFlow.length > 0 && (
                        <div className="mt-4 w-full max-w-md">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full border-dashed" onClick={() => setStepToUpdate('new-action')}>
                                        <Plus className="mr-2 h-4 w-4"/> Add a step
                                    </Button>
                                </DialogTrigger>
                                <AppSelectionModal installedApps={installedApps} onSelectApp={(app) => {
                                     const newStep: FlowStep = {
                                        id: `action-${Date.now()}`, type: 'action',
                                        appId: app.id, appName: app.title, appDescription: app.description, appIcon: app.icon, appColor: app.color
                                    };
                                    setCurrentFlow(prev => [...prev, newStep]);
                                }} />
                            </Dialog>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
    

    