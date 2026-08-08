import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    ClipboardList,
    FolderGit2,
    ChartNoAxesColumnIncreasing,
    Siren,
    Users,
} from 'lucide-react';
import { index as formManagement } from '@/actions/App/Http/Controllers/FormManagementController';
import { index as incidents } from '@/actions/App/Http/Controllers/IncidentController';
import { index as userManagement } from '@/actions/App/Http/Controllers/UserManagementController';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { statistics } from '@/routes';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { auth } = usePage().props;
    const statisticsUrl = statistics();
    const incidentsUrl = incidents();
    const formManagementUrl = formManagement();
    const userManagementUrl = userManagement();

    const mainNavItems: NavItem[] = [
        {
            title: 'Statistics',
            href: statisticsUrl,
            icon: ChartNoAxesColumnIncreasing,
        },
        {
            title: 'Incidents',
            href: incidentsUrl,
            icon: Siren,
        },
        ...(auth.user.user_role?.name === 'administrator'
            ? [
                  {
                      title: 'Form Management',
                      href: formManagementUrl,
                      icon: ClipboardList,
                  },
              ]
            : []),
        ...(auth.permissions.manage_users
            ? [
                  {
                      title: 'User Management',
                      href: userManagementUrl,
                      icon: Users,
                  },
              ]
            : []),
    ];

    const footerNavItems: NavItem[] = [
        {
            title: 'Repository',
            href: 'https://github.com/laravel/react-starter-kit',
            icon: FolderGit2,
        },
        {
            title: 'Documentation',
            href: 'https://laravel.com/docs/starter-kits#react',
            icon: BookOpen,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={statisticsUrl} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain
                    items={mainNavItems}
                    label={auth.user.region?.name ?? 'Region'}
                />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
