import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Mail,
    MapPin,
    Pencil,
    Search,
    Trash2,
    UserPlus,
    Users,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import {
    destroy,
    index as userManagement,
    store,
    update,
} from '@/actions/App/Http/Controllers/UserManagementController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { SearchableCommand } from '@/components/searchable-command';
import type { CommandOption } from '@/components/searchable-command';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInitials } from '@/hooks/use-initials';

type RoleGroup = {
    label: string;
    options: Array<{
        value: string;
        label: string;
    }>;
};

type Region = {
    id: string;
    name: string;
};

type ManagedUser = {
    id: number;
    name: string;
    email: string;
    role: string;
    role_value: string;
    region: string;
    region_id: string;
    created_at: string | null;
    created_at_display: string | null;
    can_delete: boolean;
};

type PaginatedUsers = {
    data: ManagedUser[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
};

type UserManagementProps = {
    users: PaginatedUsers;
    filters: {
        search: string;
    };
    roleGroups: RoleGroup[];
    regions: Region[];
};

export default function UserManagement({
    users,
    filters,
    roleGroups,
    regions,
}: UserManagementProps) {
    const getInitials = useInitials();
    const [addUserOpen, setAddUserOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
    const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null);
    const [searchQuery, setSearchQuery] = useState(filters.search);
    const form = useForm({
        name: '',
        email: '',
        password: 'chedsprs2026',
        user_role: '',
        region_id: '',
    });
    const editForm = useForm({
        name: '',
        email: '',
        password: '',
        user_role: '',
        region_id: '',
    });
    const deletionForm = useForm({});
    const roleOptions = useMemo<CommandOption[]>(
        () =>
            roleGroups.flatMap((group) =>
                group.options.map((option) => ({
                    ...option,
                    group: group.label,
                })),
            ),
        [roleGroups],
    );
    const regionOptions = useMemo<CommandOption[]>(
        () =>
            regions.map((region) => ({
                value: region.id,
                label: region.name,
            })),
        [regions],
    );

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post(store.url(), {
            onSuccess: () => {
                form.reset();
                setAddUserOpen(false);
            },
        });
    };

    const searchUsers = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            userManagement.url({
                query: { search: searchQuery.trim() || undefined },
            }),
            {},
            {
                only: ['users', 'filters'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const clearSearch = () => {
        setSearchQuery('');
        router.get(
            userManagement.url(),
            {},
            {
                only: ['users', 'filters'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const changeAddUserDialog = (open: boolean) => {
        setAddUserOpen(open);

        if (!open) {
            form.resetAndClearErrors();
        }
    };

    const openEditDialog = (user: ManagedUser) => {
        editForm.setData({
            name: user.name,
            email: user.email,
            password: '',
            user_role: user.role_value,
            region_id: user.region_id,
        });
        editForm.clearErrors();
        setEditingUser(user);
    };

    const changeEditDialog = (open: boolean) => {
        if (!open) {
            setEditingUser(null);
            editForm.resetAndClearErrors();
        }
    };

    const submitEdit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!editingUser) {
            return;
        }

        editForm.put(update.url(editingUser.id), {
            preserveScroll: true,
            onSuccess: () => {
                editForm.reset();
                setEditingUser(null);
            },
        });
    };

    const confirmDeletion = () => {
        if (!deletingUser) {
            return;
        }

        deletionForm.delete(destroy.url(deletingUser.id), {
            preserveScroll: true,
            onSuccess: () => setDeletingUser(null),
        });
    };

    return (
        <>
            <Head title="User Management" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="User Management"
                        description="Search accounts and manage organizational assignments."
                    />
                    <Button onClick={() => setAddUserOpen(true)}>
                        <UserPlus /> Add user
                    </Button>
                </div>

                <Card>
                    <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <CardTitle>Users</CardTitle>
                                <Badge variant="secondary">{users.total}</Badge>
                            </div>
                            <CardDescription>
                                View user roles and regional assignments.
                            </CardDescription>
                        </div>
                        <form
                            className="flex w-full flex-wrap gap-2 sm:w-auto"
                            onSubmit={searchUsers}
                        >
                            <Input
                                type="search"
                                value={searchQuery}
                                aria-label="Search users"
                                placeholder="Search name, email, role, or region"
                                className="min-w-48 flex-1 sm:w-80"
                                onChange={(event) =>
                                    setSearchQuery(event.target.value)
                                }
                            />
                            <Button type="submit" variant="outline">
                                <Search />
                                <span className="sr-only sm:not-sr-only">
                                    Search
                                </span>
                            </Button>
                            {filters.search && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={clearSearch}
                                >
                                    Clear
                                </Button>
                            )}
                        </form>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {users.data.length > 0 ? (
                            <>
                                <div className="hidden overflow-hidden rounded-xl border md:block">
                                    <table className="w-full text-sm">
                                        <thead className="border-b bg-muted/50 text-left text-xs tracking-wide text-muted-foreground uppercase">
                                            <tr>
                                                <th className="px-5 py-3.5 font-medium">
                                                    User
                                                </th>
                                                <th className="px-5 py-3.5 font-medium">
                                                    Email
                                                </th>
                                                <th className="px-5 py-3.5 font-medium">
                                                    User role
                                                </th>
                                                <th className="px-5 py-3.5 font-medium">
                                                    Region
                                                </th>
                                                <th className="px-5 py-3.5 font-medium">
                                                    Added
                                                </th>
                                                <th className="px-5 py-3.5 text-right font-medium">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {users.data.map((user) => (
                                                <tr
                                                    key={user.id}
                                                    className="transition-colors hover:bg-muted/40"
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                                                {getInitials(
                                                                    user.name,
                                                                )}
                                                            </div>
                                                            <span className="font-medium whitespace-nowrap">
                                                                {user.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-muted-foreground">
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="size-4 shrink-0" />
                                                            <span>
                                                                {user.email}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 whitespace-nowrap">
                                                        <Badge variant="secondary">
                                                            {user.role}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-5 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="size-4 shrink-0 text-muted-foreground" />
                                                            {user.region}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 whitespace-nowrap text-muted-foreground">
                                                        {user.created_at ? (
                                                            <div className="flex items-center gap-2">
                                                                <CalendarDays className="size-4 shrink-0" />
                                                                <time
                                                                    dateTime={
                                                                        user.created_at
                                                                    }
                                                                >
                                                                    {
                                                                        user.created_at_display
                                                                    }
                                                                </time>
                                                            </div>
                                                        ) : (
                                                            '—'
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="outline"
                                                                aria-label={`Edit ${user.name}`}
                                                                title={`Edit ${user.name}`}
                                                                onClick={() =>
                                                                    openEditDialog(
                                                                        user,
                                                                    )
                                                                }
                                                            >
                                                                <Pencil />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="outline"
                                                                disabled={
                                                                    !user.can_delete
                                                                }
                                                                aria-label={`Delete ${user.name}`}
                                                                title={
                                                                    user.can_delete
                                                                        ? `Delete ${user.name}`
                                                                        : 'You cannot delete your own account'
                                                                }
                                                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                                onClick={() =>
                                                                    setDeletingUser(
                                                                        user,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="grid gap-3 md:hidden">
                                    {users.data.map((user) => (
                                        <article
                                            key={user.id}
                                            className="rounded-xl border bg-card p-4 shadow-xs"
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                                    {getInitials(user.name)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate font-semibold">
                                                        {user.name}
                                                    </p>
                                                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                        <Mail className="size-3.5 shrink-0" />
                                                        <span className="truncate">
                                                            {user.email}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>

                                            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4 text-sm">
                                                <div className="min-w-0">
                                                    <dt className="text-xs text-muted-foreground">
                                                        User role
                                                    </dt>
                                                    <dd className="mt-1">
                                                        <Badge variant="secondary">
                                                            {user.role}
                                                        </Badge>
                                                    </dd>
                                                </div>
                                                <div className="min-w-0">
                                                    <dt className="text-xs text-muted-foreground">
                                                        Region
                                                    </dt>
                                                    <dd className="mt-1 flex items-center gap-1.5 font-medium">
                                                        <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                                                        <span className="truncate">
                                                            {user.region}
                                                        </span>
                                                    </dd>
                                                </div>
                                                <div className="col-span-2 min-w-0">
                                                    <dt className="text-xs text-muted-foreground">
                                                        Added
                                                    </dt>
                                                    <dd className="mt-1 flex items-center gap-1.5 font-medium">
                                                        <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
                                                        {user.created_at ? (
                                                            <time
                                                                dateTime={
                                                                    user.created_at
                                                                }
                                                            >
                                                                {
                                                                    user.created_at_display
                                                                }
                                                            </time>
                                                        ) : (
                                                            '—'
                                                        )}
                                                    </dd>
                                                </div>
                                            </dl>
                                            <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-4">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        openEditDialog(user)
                                                    }
                                                >
                                                    <Pencil /> Edit
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={!user.can_delete}
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() =>
                                                        setDeletingUser(user)
                                                    }
                                                >
                                                    <Trash2 /> Delete
                                                </Button>
                                            </div>
                                        </article>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-center sm:text-left">
                                        Showing {users.from}–{users.to} of{' '}
                                        {users.total}
                                    </p>
                                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex">
                                        {users.current_page > 1 ? (
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="outline"
                                                className="w-full sm:w-auto"
                                            >
                                                <Link
                                                    href={userManagement({
                                                        query: {
                                                            search:
                                                                filters.search ||
                                                                undefined,
                                                            page:
                                                                users.current_page -
                                                                1,
                                                        },
                                                    })}
                                                    only={['users', 'filters']}
                                                    preserveScroll
                                                    preserveState
                                                >
                                                    <ChevronLeft /> Previous
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled
                                                className="w-full sm:w-auto"
                                            >
                                                <ChevronLeft /> Previous
                                            </Button>
                                        )}
                                        <span className="px-1 text-center whitespace-nowrap sm:px-2">
                                            Page {users.current_page} of{' '}
                                            {users.last_page}
                                        </span>
                                        {users.current_page <
                                        users.last_page ? (
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="outline"
                                                className="w-full sm:w-auto"
                                            >
                                                <Link
                                                    href={userManagement({
                                                        query: {
                                                            search:
                                                                filters.search ||
                                                                undefined,
                                                            page:
                                                                users.current_page +
                                                                1,
                                                        },
                                                    })}
                                                    only={['users', 'filters']}
                                                    preserveScroll
                                                    preserveState
                                                >
                                                    Next <ChevronRight />
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled
                                                className="w-full sm:w-auto"
                                            >
                                                Next <ChevronRight />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center">
                                <Users className="size-8 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">
                                        No users found
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {filters.search
                                            ? 'Try a different name, email, role, or region.'
                                            : 'Add a user to create the first account.'}
                                    </p>
                                </div>
                                {filters.search && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={clearSearch}
                                    >
                                        Clear search
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={addUserOpen} onOpenChange={changeAddUserDialog}>
                <DialogContent className="flex h-[min(42rem,calc(100vh-2rem))] flex-col overflow-visible sm:max-w-4xl">
                    <DialogHeader className="shrink-0">
                        <DialogTitle>Add user</DialogTitle>
                        <DialogDescription>
                            Enter the account details and organizational
                            assignment.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        className="flex min-h-0 flex-1 flex-col"
                        onSubmit={submit}
                    >
                        <div className="grid gap-4 sm:gap-6">
                            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        autoFocus
                                        autoComplete="name"
                                        value={form.data.name}
                                        aria-invalid={Boolean(form.errors.name)}
                                        placeholder="Enter full name"
                                        onChange={(event) =>
                                            form.setData(
                                                'name',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError message={form.errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        value={form.data.email}
                                        aria-invalid={Boolean(
                                            form.errors.email,
                                        )}
                                        placeholder="name@example.com"
                                        onChange={(event) =>
                                            form.setData(
                                                'email',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError message={form.errors.email} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    autoComplete="new-password"
                                    value={form.data.password}
                                    aria-invalid={Boolean(form.errors.password)}
                                    onChange={(event) =>
                                        form.setData(
                                            'password',
                                            event.target.value,
                                        )
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    The default password is chedsprs2026 and is
                                    securely hashed when saved.
                                </p>
                                <InputError message={form.errors.password} />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                                <div className="grid gap-2">
                                    <Label>User role</Label>
                                    <SearchableCommand
                                        value={form.data.user_role}
                                        options={roleOptions}
                                        placeholder="Select a user role"
                                        searchPlaceholder="Search user roles..."
                                        emptyMessage="No user roles found."
                                        onValueChange={(value) =>
                                            form.setData('user_role', value)
                                        }
                                    />
                                    <InputError
                                        message={form.errors.user_role}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Region</Label>
                                    <SearchableCommand
                                        value={form.data.region_id}
                                        options={regionOptions}
                                        placeholder="Select a region"
                                        searchPlaceholder="Search regions..."
                                        emptyMessage="No regions found."
                                        onValueChange={(value) =>
                                            form.setData('region_id', value)
                                        }
                                    />
                                    <InputError
                                        message={form.errors.region_id}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="mt-auto shrink-0 border-t pt-4 sm:pt-6">
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={form.processing}
                                    className="w-full sm:w-auto"
                                >
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={form.processing}
                                className="w-full sm:w-auto"
                            >
                                <UserPlus />
                                {form.processing
                                    ? 'Adding user...'
                                    : 'Add user'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={editingUser !== null} onOpenChange={changeEditDialog}>
                <DialogContent className="flex h-[min(42rem,calc(100vh-2rem))] flex-col overflow-visible sm:max-w-4xl">
                    <DialogHeader className="shrink-0">
                        <DialogTitle>Edit user</DialogTitle>
                        <DialogDescription>
                            Update account details and organizational
                            assignment. Leave the password blank to keep the
                            current password.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        className="flex min-h-0 flex-1 flex-col"
                        onSubmit={submitEdit}
                    >
                        <div className="grid gap-4 sm:gap-6">
                            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-name">Name</Label>
                                    <Input
                                        id="edit-name"
                                        autoFocus
                                        autoComplete="name"
                                        value={editForm.data.name}
                                        aria-invalid={Boolean(
                                            editForm.errors.name,
                                        )}
                                        placeholder="Enter full name"
                                        onChange={(event) =>
                                            editForm.setData(
                                                'name',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={editForm.errors.name}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit-email">Email</Label>
                                    <Input
                                        id="edit-email"
                                        type="email"
                                        autoComplete="email"
                                        value={editForm.data.email}
                                        aria-invalid={Boolean(
                                            editForm.errors.email,
                                        )}
                                        placeholder="name@example.com"
                                        onChange={(event) =>
                                            editForm.setData(
                                                'email',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={editForm.errors.email}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="edit-password">
                                    New password
                                </Label>
                                <PasswordInput
                                    id="edit-password"
                                    autoComplete="new-password"
                                    value={editForm.data.password}
                                    aria-invalid={Boolean(
                                        editForm.errors.password,
                                    )}
                                    placeholder="Leave blank to keep current password"
                                    onChange={(event) =>
                                        editForm.setData(
                                            'password',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={editForm.errors.password}
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                                <div className="grid gap-2">
                                    <Label>User role</Label>
                                    <SearchableCommand
                                        value={editForm.data.user_role}
                                        options={roleOptions}
                                        placeholder="Select a user role"
                                        searchPlaceholder="Search user roles..."
                                        emptyMessage="No user roles found."
                                        onValueChange={(value) =>
                                            editForm.setData('user_role', value)
                                        }
                                    />
                                    <InputError
                                        message={editForm.errors.user_role}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Region</Label>
                                    <SearchableCommand
                                        value={editForm.data.region_id}
                                        options={regionOptions}
                                        placeholder="Select a region"
                                        searchPlaceholder="Search regions..."
                                        emptyMessage="No regions found."
                                        onValueChange={(value) =>
                                            editForm.setData('region_id', value)
                                        }
                                    />
                                    <InputError
                                        message={editForm.errors.region_id}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="mt-auto shrink-0 border-t pt-4 sm:pt-6">
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={editForm.processing}
                                    className="w-full sm:w-auto"
                                >
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={editForm.processing}
                                className="w-full sm:w-auto"
                            >
                                <Pencil />
                                {editForm.processing
                                    ? 'Saving changes...'
                                    : 'Save changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={deletingUser !== null}
                onOpenChange={(open) => {
                    if (!open && !deletionForm.processing) {
                        setDeletingUser(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete user?</DialogTitle>
                        <DialogDescription>
                            This will permanently delete{' '}
                            <span className="font-medium text-foreground">
                                {deletingUser?.name}
                            </span>{' '}
                            and remove access to their account.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={deletionForm.processing}
                            onClick={() => setDeletingUser(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={deletionForm.processing}
                            onClick={confirmDeletion}
                        >
                            <Trash2 />
                            {deletionForm.processing
                                ? 'Deleting...'
                                : 'Delete user'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

UserManagement.layout = {
    breadcrumbs: [
        {
            title: 'User Management',
            href: userManagement(),
        },
    ],
};
