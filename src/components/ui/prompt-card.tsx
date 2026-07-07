
'use client';

import { useAuth } from '@/hooks/useAuth';
import React, { useState } from 'react';
import { Button } from './button';
import { Play, Loader2, Mic, FileText, ImageIcon, Video, Bot, BarChart3, Palette, LayoutTemplate, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTabManager } from '@/context/TabManagerContext';
import { track } from '@/lib/events';
import { useToast } from '@/hooks/use-toast';
import { PromptCardProps } from '@/lib/prompt-library';

const icons: { [key: string]: React.ReactElement } = {
    Mic: <Mic />, FileText: <FileText />, ImageIcon: <ImageIcon />, Video: <Video />, Bot: <Bot />,
    BarChart3: <BarChart3 />, Palette: <Palette />, LayoutTemplate: <LayoutTemplate />, Sparkles: <Sparkles />
};

export function PromptCard({ prompt }: { prompt: PromptCardProps }) {
    const { title, description, iconName, color, toolId, payload } = prompt;
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { addTab } = useTabManager();
    const { toast } = useToast();
    const { user } = useAuth();
    
    const icon = icons[iconName] || <Sparkles />;

    const handleRun = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsLoading(true);
        track('prompt_library_run', { toolId, promptTitle: title });

        try {
            // For prompts that don't need a specific UI, we can run them in the background
            if (payload) {
                 if (!user) throw new Error('Please sign in to run prompts.');
                 const idToken = await user.getIdToken();
                 const response = await fetch('/api/run', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                    body: JSON.stringify({ toolId, payload }),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Failed to run prompt.");
                
                toast({
                    title: `"${title}" Executed Successfully!`,
                    description: "The AI has completed your request. Results are being processed.",
                });
                // Potentially open a results view or just show a success state.
            } else {
                // For prompts that require user input (no predefined payload), navigate to the tool page.
                addTab({ href: `/me/tool/${toolId}`, label: title });
                router.push(`/me/tool/${toolId}`);
            }

        } catch (error: any) {
            toast({
                title: "Execution Failed",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="group relative flex h-full flex-col rounded-lg border bg-card p-6 text-card-foreground shadow-sm transition-all hover:border-primary/50 hover:-translate-y-1">
            <div className="flex items-center gap-4 mb-3">
                <div className={`p-3 rounded-lg text-white ${color}`}>
                    {icon}
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
            </div>
            <p className="flex-grow text-sm text-muted-foreground">{description}</p>
            <div className="mt-4 flex justify-end">
                <Button size="sm" onClick={handleRun} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                    {isLoading ? 'Running...' : 'Run'}
                </Button>
            </div>
        </div>
    );
}
