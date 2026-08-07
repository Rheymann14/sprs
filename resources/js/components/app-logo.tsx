import { usePage } from '@inertiajs/react';

import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <div className="flex size-8 shrink-0 items-center justify-center text-sidebar-primary-foreground">
                <AppLogoIcon className="size-8" />
            </div>
            <div className="min-w-0 flex-1 text-left text-sm">
                <span className="block leading-4 font-semibold wrap-normal whitespace-normal">
                    {name}
                </span>
            </div>
        </>
    );
}
