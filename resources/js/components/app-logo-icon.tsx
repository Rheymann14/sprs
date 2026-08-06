import type { ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type AppLogoIconProps = Omit<
    ImgHTMLAttributes<HTMLImageElement>,
    'alt' | 'src'
>;

export default function AppLogoIcon({ className, ...props }: AppLogoIconProps) {
    return (
        <img
            src="/ched.png"
            alt=""
            className={cn('object-contain', className)}
            {...props}
        />
    );
}
