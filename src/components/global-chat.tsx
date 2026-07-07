

'use client';

import { useAuth } from '@/hooks/useAuth';
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Bot, Send, Loader2, User, Sparkles, PlusCircle, Copy, Workflow, ArrowLeft, ArrowRight, Settings2 } from 'lucide-react';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { secretCodes } from '@/lib/codes';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { usePathname, useRouter } from 'next/navigation';
import { useSensitiveArea } from '@/context/SensitiveAreaContext';
import { CommandMenu } from './ui/command-menu';
import { useToast } from '@/hooks/use-toast';
import { useSpotlight } from '@/context/SpotlightContext';
import { Feature } from '@/lib/tools-client';


type Message = {
    from: 'ai' | 'user';
    text: string | React.ReactNode;
};

const InitialAssistantMessage = () => (
    <div>
        <p className="font-semibold mb-2">Hello! I'm your AI co-pilot.</p>
        <p className="mb-3">Train me by uploading your brochures, price lists, and market reports to the <Link href="/me/brand" className="underline font-semibold hover:text-primary">Brand & Assets</Link> page. This gives me a knowledge base to help you better.</p>
        <p className="text-sm">Any client requests? please no complicated dreams. there's no one million 2 bedrooms in downtown!</p>
    </div>
);

type ActionKey = {
    label: string;
    icon: React.ReactNode;
    href?: string;
    action?: () => void;
}

export function GlobalChat() {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    { from: 'ai', text: <InitialAssistantMessage /> },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [lastResultToCopy, setLastResultToCopy] = useState<string | null>(null);
  const [showFlowsButton, setShowFlowsButton] = useState(false);
  
  const [isBarOnTop, setIsBarOnTop] = useState(false);


  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { activeHint, isHintActive } = useSensitiveArea();
  const { spotlightedApp } = useSpotlight();
  
  useEffect(() => {
    try {
        const savedValue = localStorage.getItem('isAnalogBarOnTop');
        setIsBarOnTop(savedValue === 'true');
    } catch(e) {}
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current && isSheetOpen) {
      setTimeout(() => {
          scrollAreaRef.current?.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  }, [messages, isSheetOpen]);
  
  useEffect(() => {
    if (input.startsWith('/') || input.startsWith('=')) {
        setIsCommandMenuOpen(true);
    } else {
        setIsCommandMenuOpen(false);
    }
  }, [input]);
  
  // Reset special button states when path changes
  useEffect(() => {
      setShowFlowsButton(false);
  }, [pathname]);

  const sendMessage = async (text: string, isPrompt: boolean = false) => {
      const userMessageText = isPrompt ? `= ${text}` : text;
      const userMessage: Message = { from: 'user', text: userMessageText };
      
      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);
      setLastResultToCopy(null);

      if (!isSheetOpen) setIsSheetOpen(true);

      try {
        if (!user) throw new Error('Please sign in to use the assistant.');
        const idToken = await user.getIdToken();
        const response = await fetch('/api/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
            body: JSON.stringify({ 
                toolId: 'smart-input-router',
                payload: { query: text }
            }),
        });

        if (!response.ok) throw new Error("The AI is experiencing some turbulence. Please try again.");

        const data = await response.json();
        const aiResponseText = JSON.stringify(data, null, 2);
        const aiResponse: Message = { from: 'ai', text: aiResponseText };
        
        setMessages(prev => [...prev, aiResponse]);
        setChatHistory(prev => [...prev, { role: 'user', content: [{ text: userMessageText }] }, { role: 'model', content: [{ text: aiResponseText }] }]);
        setLastResultToCopy(aiResponseText);
    } catch(err: any) {
        const errorResponse: Message = { from: 'ai', text: err.message };
        setMessages(prev => [...prev, errorResponse]);
    } finally {
        setIsLoading(false);
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    let currentInput = input;
    setInput('');
    
    if (currentInput.startsWith('=')) {
        await sendMessage(currentInput.substring(1), true);
        return;
    }
    
    const matchedCode = secretCodes.find(c => c.code.toLowerCase() === currentInput.toLowerCase());
    if (matchedCode) {
        const userMessage: Message = { from: 'user', text: currentInput };
        const rewardMessage: Message = {
            from: 'ai',
            text: `Secret code accepted! Here is your reward: ${matchedCode.reward}`
        };
        setMessages(prev => [...prev, userMessage, rewardMessage]);
        setIsLoading(false);
        return;
    }

    await sendMessage(currentInput);
  };
  
    const handleMagicClick = async () => {
        if (isLoading) return;
        
        const pageContent = `Current page is ${pathname}. The visible content includes a header titled "${document.title}".`;
        const prompt = `Analyze the following page content and generate a concise action plan with 2-3 bullet points of what I can do here.\n\nPage Content: ${pageContent}`;
        
        await sendMessage(prompt);
    }
    
    const getContextualInfo = (): { placeholder: string; leftKeys: ActionKey[]; rightKey: ActionKey | null } => {
        
        let rightKey: ActionKey | null = { label: 'Analyze Page', icon: <Sparkles className="h-5 w-5" />, action: handleMagicClick };
        if (lastResultToCopy) {
            rightKey = { label: 'Copy Result', icon: <Copy className="h-5 w-5" />, action: () => {
                 navigator.clipboard.writeText(lastResultToCopy || '');
                 toast({title: "Result copied to clipboard!"});
            }};
        }
        
        let leftKeys: ActionKey[] = [];

        if (spotlightedApp) {
            const isAdded = typeof window !== 'undefined' ? (localStorage.getItem('addedApps') || '[]').includes(spotlightedApp.id) : false;
            const mainAction = isAdded 
                ? { label: "Open", href: `/me/tool/${spotlightedApp.id}`, icon: <ArrowRight /> }
                : { label: "Add", action: () => {
                    let apps = JSON.parse(localStorage.getItem('addedApps') || '[]');
                    apps.push(spotlightedApp.id);
                    localStorage.setItem('addedApps', JSON.stringify(apps));
                    toast({title: `${spotlightedApp.title} Added!`, description: 'It is now available in your workspace.'});
                }, icon: <PlusCircle /> };

            return {
                placeholder: `Spotlight on: ${spotlightedApp.title}`,
                leftKeys: [mainAction],
                rightKey: { label: "Options", href: `/blog/${spotlightedApp.id}`, icon: <Settings2 /> }
            };
        }

        if (isHintActive) {
            return { placeholder: activeHint, leftKeys: [], rightKey: null };
        }
        
        if (pathname === '/me/flows') {
            leftKeys = [
                { 
                    label: "Start Building", 
                    href: undefined, 
                    icon: <Workflow />, 
                    action: () => {
                        console.log("Entering Flow Building Mode...");
                        toast({ title: "Flow Builder Activated", description: "You've opened the 'second door'. Ready to build."});
                    }
                },
            ];
        } else if (pathname.startsWith('/me/marketing')) {
             leftKeys = [
                { label: "Options", href: undefined, icon: <Settings2 />, 
                  action: () => toast({title: "Options clicked!"}) 
                },
                { label: "Get App", href: "/pricing", icon: <PlusCircle /> },
            ];
        } else if (pathname.startsWith('/me/tool/meta-auto-pilot')) {
             if (showFlowsButton) {
                leftKeys = [
                    { label: "Flows", href: "/me/flows", icon: <Workflow /> },
                ];
             } else {
                 leftKeys = [
                    { label: "Options", href: undefined, icon: <Settings2 />, 
                      action: () => {
                          toast({
                              title: "TOP META AUTOMATION APP",
                              description: "RATE: 95%, VALUE: 98%, FLOWS: 4"
                          });
                          setShowFlowsButton(true);
                      }
                    },
                ];
             }
        } else if (pathname.startsWith('/me/tool/')) {
             leftKeys = [
                { label: "Run Flow", href: "/me/flows", icon: <Workflow /> },
                { label: "Options", href: undefined, icon: <Settings2 />, action: () => toast({title: "Options clicked!"}) },
            ];
        } else {
             leftKeys = [
                { label: "Add Project", href: "/me/tool/projects-finder", icon: <PlusCircle /> },
                { label: "New Flow", href: "/me/flows", icon: <Workflow /> },
            ];
        }

        return { 
            placeholder: "Send a message, type '/' for commands, or '=' for prompts...",
            leftKeys,
            rightKey
        };
    }
    
    const { placeholder, leftKeys, rightKey } = getContextualInfo();


  return (
    <>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <div className={cn(
            "fixed left-0 right-0 z-50 bg-background/80 backdrop-blur-lg",
            isBarOnTop ? "top-14 border-b" : "bottom-0 border-t"
        )}>
            <div className="container mx-auto p-4 max-w-5xl flex items-center gap-4">
                <button onClick={() => router.back()} className="hidden md:block text-muted-foreground font-mono text-lg hover:text-primary transition-colors" aria-label="Go back">&lt;</button>
                <div className="flex items-center gap-2">
                     {leftKeys.map((key, i) => {
                        const button = (
                             <Button key={i} type="button" variant="outline" size="sm" className="hidden sm:flex" onClick={key.action}>
                                {React.cloneElement(key.icon as React.ReactElement, { className: 'mr-2 h-4 w-4' })}
                                {key.label}
                            </Button>
                        );
                        return key.href ? <Link href={key.href} key={i}>{button}</Link> : button;
                    })}
                </div>
                <form onSubmit={handleSendMessage} className="relative flex-1">
                    <div className="relative">
                        <Input 
                            placeholder={placeholder} 
                            className="w-full h-12 pl-4 pr-36 text-base"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                            autoComplete="off"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <SheetTrigger asChild>
                                 <Button type="button" variant="ghost" size="icon" title="View Chat History">
                                    <Sparkles className="h-5 w-5 text-muted-foreground" />
                                </Button>
                            </SheetTrigger>
                           {rightKey && (
                            <Button type="button" variant="ghost" size="icon" onClick={rightKey.action} disabled={isLoading} title={rightKey.label}>
                                {rightKey.icon}
                           </Button>
                           )}
                           
                            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </form>
                 <button onClick={() => router.forward()} className="hidden md:block text-muted-foreground font-mono text-lg hover:text-primary transition-colors" aria-label="Go forward">&gt;</button>
            </div>
        </div>
        <SheetContent side={isBarOnTop ? "top" : "bottom"} className="h-4/5 flex flex-col p-0 border-t-2 z-40" hideCloseButton={true}>
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef as any}>
                <div className="space-y-4 max-w-4xl mx-auto w-full">
                    {messages.map((msg, index) => (
                        <div key={index} className={cn("flex items-start gap-3", msg.from === 'user' ? 'justify-end' : 'justify-start')}>
                            {msg.from === 'ai' && (
                                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0"><Bot className="h-5 w-5" /></div>
                            )}
                            <div className={cn("max-w-xl rounded-2xl p-3 text-sm whitespace-pre-wrap", msg.from === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none')}>
                                {msg.text}
                            </div>
                            {msg.from === 'user' && (
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0"><User className="h-5 w-5"/></div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3 justify-start">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0"><Bot className="h-5 w-5" /></div>
                            <div className="rounded-2xl p-3 text-sm bg-muted rounded-bl-none">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </SheetContent>
      </Sheet>
      <CommandMenu open={isCommandMenuOpen} setOpen={setIsCommandMenuOpen} />
    </>
  );
}
