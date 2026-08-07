<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\UserRole;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

#[Signature('make:admin')]
#[Description('Create an administrator account')]
class MakeAdminCommand extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $input = [
            'name' => $this->ask('Name'),
            'email' => Str::lower((string) $this->ask('Email')),
            'password' => $this->secret('Password'),
        ];

        $validator = Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique(User::class, 'email')],
            'password' => ['required', 'string', Password::default()],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $validated = $validator->validated();

        DB::transaction(function () use ($validated): void {
            $administratorRole = UserRole::query()->firstOrCreate([
                'name' => UserRole::Administrator,
            ]);

            User::query()->create([
                'name' => Str::squish($validated['name']),
                'email' => Str::lower($validated['email']),
                'password' => Hash::make($validated['password']),
                'user_role_id' => $administratorRole->id,
            ]);

        });

        $this->info('Administrator created successfully.');

        return self::SUCCESS;
    }
}
