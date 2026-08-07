export type Region = {
    id: string;
    name: string;
};

export type UserRole = {
    id: string;
    name: string;
};

export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    region: Region | null;
    user_role: UserRole | null;
    region_id: string | null;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

/* @chisel-passkeys */
export type Passkey = {
    id: number;
    name: string;
    authenticator: string | null;
    created_at_diff: string;
    last_used_at_diff: string | null;
};
/* @end-chisel-passkeys */
