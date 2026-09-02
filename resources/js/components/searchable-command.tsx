import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type CommandOption = {
    value: string;
    label: string;
    group?: string;
    icon?: ComponentType<{ className?: string }>;
};

type SearchableCommandProps = {
    id?: string;
    value: string;
    options: CommandOption[];
    placeholder: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    disabled?: boolean;
    onValueChange: (value: string) => void;
};

type SearchableMultiCommandProps = {
    value: string[];
    options: CommandOption[];
    placeholder: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    selectedLabel?: string;
    disabled?: boolean;
    onValueChange: (value: string[]) => void;
};

export function SearchableCommand({
    id,
    value,
    options,
    placeholder,
    searchPlaceholder = 'Search...',
    emptyMessage = 'No results found.',
    disabled = false,
    onValueChange,
}: SearchableCommandProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const rootRef = useRef<HTMLDivElement>(null);
    const selectedOption = options.find((option) => option.value === value);
    const SelectedIcon = selectedOption?.icon;
    const filteredOptions = useMemo(
        () =>
            options.filter((option) =>
                option.label
                    .toLocaleLowerCase()
                    .includes(search.toLocaleLowerCase()),
            ),
        [options, search],
    );
    const groupedOptions = useMemo(
        () =>
            filteredOptions.reduce<Map<string, CommandOption[]>>(
                (groups, option) => {
                    const group = option.group ?? '';
                    groups.set(group, [...(groups.get(group) ?? []), option]);

                    return groups;
                },
                new Map(),
            ),
        [filteredOptions],
    );

    useEffect(() => {
        const closeWhenClickingOutside = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', closeWhenClickingOutside);

        return () =>
            document.removeEventListener('mousedown', closeWhenClickingOutside);
    }, []);

    return (
        <div ref={rootRef} className="relative w-full">
            <Button
                id={id}
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                aria-haspopup="listbox"
                disabled={disabled}
                className="w-full justify-between font-normal"
                onClick={() => setOpen((current) => !current)}
            >
                <span className="flex min-w-0 items-center gap-2">
                    {SelectedIcon && (
                        <SelectedIcon className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <span
                        className={cn(
                            'truncate',
                            !selectedOption && 'text-muted-foreground',
                        )}
                    >
                        {selectedOption?.label ?? placeholder}
                    </span>
                </span>
                <ChevronsUpDown className="opacity-50" />
            </Button>

            {open && (
                <div className="absolute z-50 mt-1 w-full min-w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                    <div className="relative p-1">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            autoFocus
                            value={search}
                            placeholder={searchPlaceholder}
                            className="pl-8"
                            onChange={(event) => setSearch(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Escape') {
                                    setOpen(false);
                                }
                            }}
                        />
                    </div>
                    <div
                        role="listbox"
                        className="max-h-60 overflow-y-auto p-1"
                    >
                        {filteredOptions.length === 0 ? (
                            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                                {emptyMessage}
                            </p>
                        ) : (
                            Array.from(groupedOptions.entries()).map(
                                ([group, groupOptions]) => (
                                    <div key={group || 'options'}>
                                        {group && (
                                            <p className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">
                                                {group}
                                            </p>
                                        )}
                                        {groupOptions.map((option) => {
                                            const OptionIcon = option.icon;

                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    role="option"
                                                    aria-selected={
                                                        value === option.value
                                                    }
                                                    className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent"
                                                    onClick={() => {
                                                        onValueChange(
                                                            option.value,
                                                        );
                                                        setOpen(false);
                                                        setSearch('');
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            'size-4',
                                                            value ===
                                                                option.value
                                                                ? 'opacity-100'
                                                                : 'opacity-0',
                                                        )}
                                                    />
                                                    {OptionIcon && (
                                                        <OptionIcon className="size-4 shrink-0 text-muted-foreground" />
                                                    )}
                                                    <span className="truncate">
                                                        {option.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ),
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export function SearchableMultiCommand({
    value,
    options,
    placeholder,
    searchPlaceholder = 'Search...',
    emptyMessage = 'No results found.',
    selectedLabel = 'selected',
    disabled = false,
    onValueChange,
}: SearchableMultiCommandProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const rootRef = useRef<HTMLDivElement>(null);
    const selectedOptions = options.filter((option) =>
        value.includes(option.value),
    );
    const filteredOptions = useMemo(
        () =>
            options.filter((option) =>
                option.label
                    .toLocaleLowerCase()
                    .includes(search.toLocaleLowerCase()),
            ),
        [options, search],
    );
    const groupedOptions = useMemo(
        () =>
            filteredOptions.reduce<Map<string, CommandOption[]>>(
                (groups, option) => {
                    const group = option.group ?? '';
                    groups.set(group, [...(groups.get(group) ?? []), option]);

                    return groups;
                },
                new Map(),
            ),
        [filteredOptions],
    );

    useEffect(() => {
        const closeWhenClickingOutside = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', closeWhenClickingOutside);

        return () =>
            document.removeEventListener('mousedown', closeWhenClickingOutside);
    }, []);

    const toggleOption = (optionValue: string) => {
        onValueChange(
            value.includes(optionValue)
                ? value.filter((currentValue) => currentValue !== optionValue)
                : [...value, optionValue],
        );
    };

    return (
        <div ref={rootRef} className="relative w-full">
            <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                aria-haspopup="listbox"
                disabled={disabled}
                className="w-full justify-between font-normal"
                onClick={() => setOpen((current) => !current)}
            >
                <span
                    className={cn(
                        'truncate',
                        selectedOptions.length === 0 && 'text-muted-foreground',
                    )}
                >
                    {selectedOptions.length === 0
                        ? placeholder
                        : selectedOptions.length === 1
                          ? selectedOptions[0].label
                          : `${selectedOptions.length} ${selectedLabel}`}
                </span>
                <ChevronsUpDown className="opacity-50" />
            </Button>

            {selectedOptions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                    {selectedOptions.map((option) => (
                        <span
                            key={option.value}
                            className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
                        >
                            {option.label}
                            <button
                                type="button"
                                className="rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label={`Remove ${option.label}`}
                                disabled={disabled}
                                onClick={() => toggleOption(option.value)}
                            >
                                <span aria-hidden="true">×</span>
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {open && (
                <div className="absolute z-50 mt-1 w-full min-w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                    <div className="relative p-1">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            autoFocus
                            value={search}
                            aria-label={searchPlaceholder}
                            placeholder={searchPlaceholder}
                            className="pl-8"
                            onChange={(event) => setSearch(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Escape') {
                                    setOpen(false);
                                }
                            }}
                        />
                    </div>
                    <div
                        role="listbox"
                        aria-multiselectable="true"
                        className="max-h-60 overflow-y-auto p-1"
                    >
                        {filteredOptions.length === 0 ? (
                            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                                {emptyMessage}
                            </p>
                        ) : (
                            Array.from(groupedOptions.entries()).map(
                                ([group, groupOptions]) => (
                                    <div key={group || 'options'}>
                                        {group && (
                                            <p className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">
                                                {group}
                                            </p>
                                        )}
                                        {groupOptions.map((option) => {
                                            const selected = value.includes(
                                                option.value,
                                            );
                                            const OptionIcon = option.icon;

                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    role="option"
                                                    aria-selected={selected}
                                                    className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent"
                                                    onClick={() =>
                                                        toggleOption(
                                                            option.value,
                                                        )
                                                    }
                                                >
                                                    <Check
                                                        className={cn(
                                                            'size-4',
                                                            selected
                                                                ? 'opacity-100'
                                                                : 'opacity-0',
                                                        )}
                                                    />
                                                    {OptionIcon && (
                                                        <OptionIcon className="size-4 shrink-0 text-muted-foreground" />
                                                    )}
                                                    <span className="truncate">
                                                        {option.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ),
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
