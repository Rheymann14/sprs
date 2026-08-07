import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { dashboard, login } from '@/routes';

export default function Welcome() {
    const { auth } = usePage().props;
    const destination = auth.user ? dashboard() : login();
    const actionLabel = auth.user
        ? 'Go to your dashboard'
        : 'Sign in to your account';

    return (
        <>
            <Head title="Student Protection Reporting System" />

            <main className="relative isolate flex h-dvh min-h-0 flex-col overflow-hidden bg-[#f8faff] px-4 text-[#151a27] sm:px-6">
                <div
                    aria-hidden="true"
                    className="absolute top-[-9rem] left-1/2 size-80 -translate-x-1/2 rounded-full bg-[#dce7ff]/70 blur-3xl sm:size-[30rem]"
                />
                <div
                    aria-hidden="true"
                    className="absolute right-[-8rem] bottom-[-10rem] size-72 rounded-full bg-[#e9efff]/80 blur-3xl sm:size-96"
                />

                <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center py-8 sm:py-12 lg:py-16">
                    <section className="flex w-full max-w-4xl flex-col items-center gap-4 text-center sm:gap-5 lg:gap-6">
                        <div className="relative size-24 overflow-hidden rounded-[1.4rem] bg-[#08285c] shadow-[0_18px_45px_-18px_rgba(7,26,64,0.65)] ring-1 ring-[#173c77]/10 sm:size-28 sm:rounded-[1.6rem] lg:size-32">
                            <img
                                src="/sprs.png"
                                alt="Student Protection Reporting System logo"
                                className="size-full scale-[1.16] object-cover"
                            />
                        </div>

                        <p className="max-w-xs text-[0.65rem] leading-5 font-semibold tracking-[0.24em] text-[#174293] uppercase sm:max-w-none sm:text-xs sm:tracking-[0.3em]">
                            Commission on Higher Education
                        </p>

                        <div className="flex w-full flex-col items-center gap-3 sm:gap-4">
                            <h1 className="max-w-3xl text-[2rem] leading-[1.08] font-bold tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl">
                                Student Protection
                                <span className="block">Reporting System</span>
                            </h1>
                            <p className="max-w-lg text-sm leading-6 text-pretty text-[#40506f] sm:text-base sm:leading-7 lg:max-w-xl lg:text-lg">
                                A secure and confidential space to report
                                concerns, seek support, and help protect every
                                student.
                            </p>
                        </div>

                        <Link
                            href={destination}
                            prefetch
                            className="group mt-1 inline-flex min-h-12 w-full max-w-xs items-center justify-center gap-3 rounded-full bg-[#102b62] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-16px_rgba(16,43,98,0.95)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#0a2152] hover:shadow-[0_18px_35px_-16px_rgba(16,43,98,0.9)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#174293] active:translate-y-0 motion-reduce:transform-none sm:w-auto sm:max-w-none sm:px-8"
                        >
                            {actionLabel}
                            <ArrowRight
                                aria-hidden="true"
                                className="size-4 transition-transform group-hover:translate-x-1"
                            />
                        </Link>
                    </section>
                </div>

                <footer className="relative z-10 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center text-[0.7rem] leading-5 text-[#72809d] sm:pb-7 sm:text-xs">
                    For authorized CHED personnel only
                </footer>
            </main>
        </>
    );
}
