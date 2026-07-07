'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, AlertCircle, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { track } from '@/lib/events';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/hooks/useAuth';
import { dealAnalyzer, DealAnalyzerOutput } from '@/ai/flows/market-intelligence/deal-analyzer';
import { DealAnalyzerInputSchema } from '@/ai/flows/types';

const ToolPage = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<DealAnalyzerOutput | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(DealAnalyzerInputSchema),
    defaultValues: {
      propertyAddress: '123 Ocean View, Dubai Marina',
    }
  });

  const handleGeneration = async (data: any) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    if (!user) {
        toast({ title: 'Authentication Required', variant: 'destructive' });
        setIsLoading(false);
        return;
    }
    
    try {
        track('tool_run_started', { toolId: 'deal-analyzer' });
        const responseData = await dealAnalyzer(data);
        setResult(responseData);
        track('tool_run_succeeded', { toolId: 'deal-analyzer' });
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred.');
      toast({ title: "Generation Failed", description: e.message, variant: 'destructive' });
      track('tool_run_failed', { toolId: 'deal-analyzer', error: e.message });
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderResultContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                    <div>
                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-2 mx-auto" />
                        <p>The AI Data Agent is fetching market data, then the Analyzer will run...</p>
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            );
        }
        
        if (!result) {
            return (
                 <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                    <p>The AI-generated analysis will appear here.</p>
                </div>
            )
        }
        
       return (
            <div className="space-y-4">
                <Card className="bg-blue-500/10 border-blue-500/30">
                     <CardHeader>
                        <CardTitle className="text-blue-600">AI Data Agent Results</CardTitle>
                        <CardDescription>The following data was estimated by the AI based on market analysis.</CardDescription>
                     </CardHeader>
                     <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><p className="text-sm font-semibold">Est. Value</p><p>AED {result.fetchedData.estimatedValue.toLocaleString()}</p></div>
                        <div><p className="text-sm font-semibold">Est. Rent</p><p>AED {result.fetchedData.estimatedMonthlyRent.toLocaleString()}/mo</p></div>
                        <div><p className="text-sm font-semibold">Est. Expenses</p><p>AED {result.fetchedData.estimatedMonthlyExpenses.toLocaleString()}/mo</p></div>
                     </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Investment Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{result.analysis.analysisSummary}</p>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Monthly Cash Flow</CardTitle></CardHeader>
                        <CardContent><p className="text-xl font-bold">AED {result.analysis.monthlyCashFlow.toLocaleString()}</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-base">Cash on Cash ROI</CardTitle></CardHeader>
                        <CardContent><p className="text-xl font-bold">{result.analysis.cashOnCashROI.toFixed(2)}%</p></CardContent>
                    </Card>
                        <Card>
                        <CardHeader><CardTitle className="text-base">Cap Rate</CardTitle></CardHeader>
                        <CardContent><p className="text-xl font-bold">{result.analysis.capitalizationRate.toFixed(2)}%</p></CardContent>
                    </Card>
                </div>
            </div>
        );
  };


  return (
    <main className="p-4 md:p-10 space-y-8 container mx-auto">
       <PageHeader
            title="Deal Analyzer"
            description="Enter a property address and let the AI data agent fetch market estimates and run a full investment analysis."
            icon={<BarChart3 />}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <Card>
                <form onSubmit={handleSubmit(handleGeneration)}>
                    <CardHeader>
                        <CardTitle>Analyze a Property</CardTitle>
                        <CardDescription>
                            Provide an address to start the analysis.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <Controller name="propertyAddress" control={control} render={({ field }) => (
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="propertyAddress">Property Address</Label>
                                <Input id="propertyAddress" {...field} />
                                {errors.propertyAddress && <p className="text-sm text-destructive">{errors.propertyAddress.message}</p>}
                            </div>
                        )} />
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" size="lg" disabled={isLoading}>
                        {isLoading ? (
                            <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Analyzing...
                            </>
                        ) : (
                             <>
                            <Sparkles className="mr-2 h-5 w-5" />
                            Analyze Deal
                            </>
                        )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
            
            <Card>
                 <CardHeader>
                    <CardTitle>Result</CardTitle>
                    <CardDescription>The AI-generated analysis will appear here.</CardDescription>
                </CardHeader>
                <CardContent className="min-h-[400px]">
                    {renderResultContent()}
                </CardContent>
            </Card>
        </div>
    </main>
  );
}

export default ToolPage;
