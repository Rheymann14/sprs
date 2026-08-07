import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

export function useFlashToast(): void {
    useEffect(() => {
        const removeFlashListener = router.on('flash', (event) => {
            const flash = (event as CustomEvent).detail?.flash;
            const data = flash?.toast as FlashToast | undefined;

            if (!data) {
                return;
            }

            toast[data.type](data.message);
        });

        const removeErrorListener = router.on('error', (event) => {
            const validationMessages = [
                ...new Set(Object.values(event.detail.errors)),
            ];

            if (validationMessages.length === 0) {
                return;
            }

            const [firstMessage, ...remainingMessages] = validationMessages;

            toast.error('Please check your input', {
                description:
                    remainingMessages.length === 0
                        ? firstMessage
                        : `${firstMessage} (+${remainingMessages.length} more)`,
                duration: 6000,
            });
        });

        return () => {
            removeFlashListener();
            removeErrorListener();
        };
    }, []);
}
