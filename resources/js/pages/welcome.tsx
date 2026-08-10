import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Moon, Sun } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';
import { login, statistics } from '@/routes';

export default function Welcome() {
    const { auth } = usePage().props;
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const destination = auth.user ? statistics() : login();
    const actionLabel = auth.user
        ? 'View statistics'
        : 'Sign in to your account';

    return (
        <>
            <Head title="Student Incident Reporting System" />

            <main className="relative isolate flex h-dvh min-h-0 flex-col overflow-hidden bg-[#f8faff] px-4 text-[#151a27] transition-colors sm:px-6 dark:bg-[#07111f] dark:text-[#f3f6ff]">
                <div
                    aria-hidden="true"
                    className="absolute top-[-9rem] left-1/2 size-80 -translate-x-1/2 rounded-full bg-[#dce7ff]/70 blur-3xl sm:size-[30rem] dark:bg-[#12356f]/45"
                />
                <div
                    aria-hidden="true"
                    className="absolute right-[-8rem] bottom-[-10rem] size-72 rounded-full bg-[#e9efff]/80 blur-3xl sm:size-96 dark:bg-[#102b62]/40"
                />

                <button
                    type="button"
                    onClick={() =>
                        updateAppearance(
                            resolvedAppearance === 'dark' ? 'light' : 'dark',
                        )
                    }
                    className="absolute top-4 right-4 z-20 inline-flex size-10 items-center justify-center rounded-full border border-[#cbd7ee] bg-white/80 text-[#174293] shadow-sm backdrop-blur transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174293] sm:top-6 sm:right-6 dark:border-white/15 dark:bg-white/10 dark:text-[#dce7ff] dark:hover:bg-white/15 dark:focus-visible:outline-[#9ab8f1]"
                    aria-label={`Switch to ${resolvedAppearance === 'dark' ? 'light' : 'dark'} mode`}
                    title={`Switch to ${resolvedAppearance === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {resolvedAppearance === 'dark' ? (
                        <Sun aria-hidden="true" className="size-4" />
                    ) : (
                        <Moon aria-hidden="true" className="size-4" />
                    )}
                </button>

                <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center py-8 sm:py-12 lg:py-16">
                    <section className="flex w-full max-w-4xl flex-col items-center gap-4 text-center sm:gap-5 lg:gap-6">
                        <div className="flex items-center justify-center gap-5 sm:gap-6">
                            <img
                                src="/ched.png"
                                alt="Commission on Higher Education logo"
                                className="size-20 object-contain sm:size-24"
                            />
                            <img
                                src="/achieve.png"
                                alt="ACHIEVE logo"
                                className="size-20 scale-150 object-contain sm:size-24"
                            />
                        </div>

                        <p className="max-w-xs text-[0.65rem] leading-5 font-semibold tracking-[0.24em] text-[#174293] uppercase sm:max-w-none sm:text-xs sm:tracking-[0.3em] dark:text-[#9ab8f1]">
                            Commission on Higher Education
                        </p>

                        <div className="flex w-full flex-col items-center gap-3 sm:gap-4">
                            <h1 className="max-w-3xl text-[2rem] leading-[1.08] font-bold tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl">
                                Student Incident
                                <span className="block">Reporting System</span>
                            </h1>
                            <p className="max-w-lg text-sm leading-6 text-pretty text-[#40506f] sm:text-base sm:leading-7 lg:max-w-xl lg:text-lg dark:text-[#b7c4dc]">
                                A secure and confidential space to report
                                concerns, seek support, and help protect every
                                student.
                            </p>
                        </div>

                        <Link
                            href={destination}
                            prefetch
                            className="group mt-1 inline-flex min-h-12 w-full max-w-xs items-center justify-center gap-3 rounded-full bg-[#102b62] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-16px_rgba(16,43,98,0.95)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#0a2152] hover:shadow-[0_18px_35px_-16px_rgba(16,43,98,0.9)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#174293] active:translate-y-0 motion-reduce:transform-none sm:w-auto sm:max-w-none sm:px-8 dark:bg-[#dce7ff] dark:text-[#0a2152] dark:hover:bg-white dark:focus-visible:outline-[#9ab8f1]"
                        >
                            {actionLabel}
                            <ArrowRight
                                aria-hidden="true"
                                className="size-4 transition-transform group-hover:translate-x-1"
                            />
                        </Link>
                    </section>
                </div>

                <footer className="relative z-10 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center text-[0.7rem] leading-5 text-[#72809d] sm:pb-7 sm:text-xs dark:text-[#8797b4]">
                    For authorized CHED personnel only
                </footer>
            </main>
        </>
    );
}
