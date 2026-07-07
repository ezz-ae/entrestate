
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, GanttChartSquare, User as UserIcon, LayoutDashboard, Compass, Workflow, FolderCog, Library, Mic } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase';
import { Logo } from '@/components/logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname } from 'next/navigation';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';

const mainNavLinks = [
  { href: '/me/workspace', label: 'Workspace', icon: <LayoutDashboard /> },
  { href: '/me/marketing', label: 'Marketplace', icon: <Compass /> },
  { href: '/me/voice-pages', label: 'Voice Pages', icon: <Mic /> },
  { href: '/me/flows', label: 'Flows', icon: <Workflow /> },
  { href: '/me/brand', label: 'Brand & Assets', icon: <FolderCog /> },
  { href: '/me/tool/prompt-library', label: 'Prompt Library', icon: <Library /> },
];

export function WorkspaceHeader() {
  const { user } = useAuth();
  const pathname = usePathname();

  const handleLogout = async () => {
    if (auth) {
        await auth.signOut();
        window.location.href = '/';
    }
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-auto flex items-center gap-4">
          <div className="hidden sm:block">
            <Logo href="/me" />
          </div>
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {mainNavLinks.map((link) => (
                <NavigationMenuItem key={link.href}>
                  <Link href={link.href} legacyBehavior passHref>
                    <NavigationMenuLink active={pathname.startsWith(link.href)} className={navigationMenuTriggerStyle()}>
                       {React.cloneElement(link.icon, { className: 'mr-2 h-4 w-4' })}
                       {link.label}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        
        <div className="flex items-center gap-4">
            <Link href="/gem">
                <Button variant="ghost" size="sm">
                    <GanttChartSquare className="mr-2 h-4 w-4" />
                    Gem
                </Button>
            </Link>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                            <AvatarFallback>
                                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon />}
                            </AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/me/settings" className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

      </div>
    </header>
  );
}
