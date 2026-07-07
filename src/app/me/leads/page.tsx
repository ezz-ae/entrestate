
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, UserPlus, Mail, Phone, Loader2, User } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

type Lead = {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    status?: string;
    interest_level?: string;
    source?: string;
    lastContacted?: string;
    assigned_to?: string;
    property?: string;
    /** Written by AI Voice Landing Pages */
    listingTitle?: string;
    note?: string;
    createdAt?: unknown;
};

// Leads come from several writers (manual form, voice pages) with different
// date shapes: ISO strings, millis, or Firestore Timestamp JSON. Never crash
// the table over a date.
function leadWhen(lead: Lead): string {
    const raw: any = lead.lastContacted ?? lead.createdAt;
    if (!raw) return '—';
    let d: Date;
    if (typeof raw === 'object' && raw !== null && '_seconds' in raw) d = new Date(raw._seconds * 1000);
    else d = new Date(raw);
    if (isNaN(d.getTime())) return '—';
    try {
        return formatDistanceToNow(d, { addSuffix: true });
    } catch {
        return '—';
    }
}


const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  'New': 'default',
  'Contacted': 'secondary',
  'Qualified': 'default',
  'Proposal Sent': 'default',
  'Closed': 'secondary',
  'Not Interested': 'destructive',
  'default': 'outline',
};

const interestVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  'Very High': 'default',
  'High': 'secondary',
  'Medium': 'outline',
  'Low': 'destructive',
  'default': 'secondary',
};

const CreateLeadForm = ({ setOpen, onLeadCreated }: { setOpen: (open: boolean) => void, onLeadCreated: () => void }) => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) {
            toast({ title: 'Not Authenticated', variant: 'destructive' });
            return;
        }
        setIsSubmitting(true);
        
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            const idToken = await user.getIdToken();
            const response = await fetch('/api/leads', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            if (!result.ok) throw new Error(result.error || "An unknown error occurred.");

            toast({
                title: "Lead Created",
                description: "The new lead has been added to your CRM.",
            });
            onLeadCreated();
            setOpen(false);

        } catch (error: any) {
             toast({
                title: "Failed to Create Lead",
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input name="name" id="name" required className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input name="email" id="email" type="email" required className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">Phone</Label>
                <Input name="phone" id="phone" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">Status</Label>
                 <Select name="status" defaultValue="New">
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Contacted">Contacted</SelectItem>
                        <SelectItem value="Qualified">Qualified</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Lead
                </Button>
            </DialogFooter>
        </form>
    );
};


export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const fetchLeads = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/leads', {
            headers: { 'Authorization': `Bearer ${idToken}` }
        });
        const result = await response.json();
        if (!result.ok) throw new Error(result.error);
        setLeads(result.data);
    } catch (error: any) {
        toast({ title: 'Failed to fetch leads', description: error.message, variant: 'destructive'});
    } finally {
        setIsLoading(false);
    }
  }, [user, toast]);
  
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return (
    <main className="p-4 md:p-10 space-y-8">
       <PageHeader
        title="Leads (CRM)"
        description="Manage your client relationships and track potential sales opportunities from all your sources in one place."
        icon={<UserPlus className="h-8 w-8" />}
      >
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create New Lead
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Lead</DialogTitle>
                    <DialogDescription>Add a new contact to your CRM manually.</DialogDescription>
                </DialogHeader>
                <CreateLeadForm setOpen={setIsFormOpen} onLeadCreated={fetchLeads} />
            </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardHeader>
            <CardTitle>Your Lead Pipeline</CardTitle>
            <CardDescription>A list of all your current and past leads.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                 <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                    <span>Loading leads...</span>
                </div>
            ) : (
                <div className="border rounded-lg w-full">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Lead</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Interest</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead className="hidden md:table-cell">Property Interest</TableHead>
                        <TableHead className="hidden md:table-cell">Last Contacted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leads.map((lead) => (
                        <TableRow key={lead.id}>
                            <TableCell className="font-medium">
                                <div className="font-medium">{lead.name}</div>
                                <div className="text-xs text-muted-foreground">{lead.email || lead.phone || ''}</div>
                            </TableCell>
                            <TableCell>
                            <Badge variant={statusVariant[lead.status || ''] || 'secondary'}>{lead.status || 'New'}</Badge>
                            </TableCell>
                            <TableCell>
                            {lead.interest_level ? (
                                <Badge variant={interestVariant[lead.interest_level] || 'outline'}>{lead.interest_level}</Badge>
                            ) : (
                                <span className="text-muted-foreground">—</span>
                            )}
                            </TableCell>
                            <TableCell>{lead.source === 'voice-page' ? <Badge variant="outline">AI voice page</Badge> : (lead.source || '—')}</TableCell>
                            <TableCell className="hidden md:table-cell">{lead.property || lead.listingTitle || 'N/A'}</TableCell>
                            <TableCell className="hidden md:table-cell">{leadWhen(lead)}</TableCell>
                            <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem><User className="mr-2 h-4 w-4" />View Profile</DropdownMenuItem>
                                <DropdownMenuItem><Mail className="mr-2 h-4 w-4" />Send Email</DropdownMenuItem>
                                <DropdownMenuItem><Phone className="mr-2 h-4 w-4" />Log a Call</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">Delete Lead</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
            )}
        </CardContent>
      </Card>
    </main>
  );
}
