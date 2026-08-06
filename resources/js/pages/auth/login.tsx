import { Form, Head } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TeamInvitationAlert from '@/components/team-invitation-alert';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import type { TeamInvitationContext } from '@/types';

type Props = {
    status?: string;
    canResetPassword: boolean;
    teamInvitation?: TeamInvitationContext | null;
};

export default function Login({
    status,
    canResetPassword,
    teamInvitation,
}: Props) {
    return (
        <>
            <Head title="Log in" />

            {teamInvitation && (
                <TeamInvitationAlert
                    invitation={teamInvitation}
                    action="Log in"
                />
            )}

            <div className="rounded-2xl border border-slate-200 bg-card p-6 shadow-[0_1px_3px_0_rgb(15_23_42_/_0.12)] dark:border-slate-800">
                <Form
                    {...store.form()}
                    resetOnSuccess={['password']}
                    className="flex flex-col gap-6"
                >
                    {({ processing, errors }) => (
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="email"
                                    className="text-slate-900 dark:text-slate-100"
                                >
                                    Email address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="name@ched.gov.ph"
                                    className="h-12 rounded-xl border-slate-200 bg-slate-50 px-4 text-sm shadow-none placeholder:text-slate-500 focus-visible:border-blue-600 focus-visible:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-900"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label
                                        htmlFor="password"
                                        className="text-slate-900 dark:text-slate-100"
                                    >
                                        Password
                                    </Label>
                                    {/* {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-xs font-medium text-blue-700 no-underline hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )} */}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    className="h-12 rounded-xl border-slate-200 bg-slate-50 px-4 text-sm shadow-none placeholder:text-slate-500 focus-visible:border-blue-600 focus-visible:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-900"
                                />
                                <InputError message={errors.password} />
                            </div>

                            {/* <div className="flex items-center gap-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                    className="border-slate-300 data-[state=checked]:border-[#172554] data-[state=checked]:bg-[#172554] dark:border-slate-700"
                                />
                                <Label
                                    htmlFor="remember"
                                    className="font-normal text-slate-700 dark:text-slate-300"
                                >
                                    Keep me signed in
                                </Label>
                            </div> */}

                            <Button
                                type="submit"
                                className="mt-1 h-12 w-full rounded-xl bg-[#172554] text-sm font-semibold text-white shadow-sm hover:bg-[#1e3a8a] focus-visible:ring-blue-700/30 dark:bg-blue-700 dark:hover:bg-blue-600"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Get Started
                            </Button>
                        </div>
                    )}
                </Form>
            </div>

            {status && (
                <div className="text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                <ShieldCheck className="size-4 text-blue-300 dark:text-blue-500" />
                <span>Authorized CHED personnel only</span>
            </div>
        </>
    );
}

Login.layout = {
    title: 'Welcome back',
    description: 'Enter your email and password to continue.',
};
