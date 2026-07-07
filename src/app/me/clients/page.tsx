'use client';

import React from 'react';
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
import { MoreHorizontal, UserPlus, Eye, Link as LinkIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { PreviewBanner } from '@/components/preview-banner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mockClients = [
  { id: 1, name: 'Alice Johnson', status: 'Active Buyer', pageStatus: 'Live', pageUrl: '/clients/alice-johnson' },
  { id: 2, name: 'Bob Williams', status: 'Past Seller', pageStatus: 'Archived', pageUrl: '#' },
  { id: 3, name: 'Charlie Brown', status: 'Active Investor', pageStatus: 'Live', pageUrl: '/clients/charlie-brown' },
  { id: 4, name: 'Diana Miller', status: 'Prospect', pageStatus: 'Not Created', pageUrl: '#' },
];

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  'Active Buyer': 'default',
  'Past Seller': 'secondary',
  'Active Investor': 'default',
  'Prospect': 'outline',
};

const pageStatusVariant: { [key: string]: "default" | "secondary" | "outline" } = {
    'Live': 'default',
    'Archived': 'secondary',
    'Not Created': 'outline',
};

export default function ClientsPage() {
  return (
    <main className="p-4 md:p-10 space-y-8">
       <PageHeader
        title="Client Pages"
        description="Manage dedicated pages and assets for each of your clients."
        icon={<UserPlus className="h-8 w-8" />}
      >
         <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add New Client
        </Button>
      </PageHeader>

      <PreviewBanner feature="Client Pages" />

      <div className="border rounded-lg w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Client Page</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[client.status] || 'secondary'}>{client.status}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={pageStatusVariant[client.pageStatus] || 'secondary'}>{client.pageStatus}</Badge>
                </TableCell>
                <TableCell className="text-right">
                   <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <a href={client.pageUrl} target="_blank" rel="noopener noreferrer">
                            <LinkIcon className="mr-2 h-4 w-4" />
                            View Page
                        </a>
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>Edit Client</DropdownMenuItem>
                        <DropdownMenuItem>Update Page</DropdownMenuItem>
                        <DropdownMenuItem>Archive Client</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                   </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
