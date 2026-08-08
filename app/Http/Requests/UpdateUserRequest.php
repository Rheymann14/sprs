<?php

namespace App\Http\Requests;

use App\Models\Region;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->region_id !== null
            && $this->user()->region_id === $this->route('user')?->region_id
            && $this->user()->can('manage-users');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class, 'email')->ignore($this->route('user')),
            ],
            'password' => ['nullable', 'string', Password::min(8)],
            'user_role' => [
                'required',
                'string',
                Rule::in(collect(UserRole::assignableNames())
                    ->merge(UserRole::query()->where('name', '!=', UserRole::Administrator)->pluck('name'))
                    ->unique()
                    ->all()),
            ],
            'region_id' => [
                'required',
                'string',
                Rule::exists(Region::class, 'id'),
                Rule::in([$this->user()?->region_id]),
            ],
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => Str::squish((string) $this->input('name')),
            'email' => Str::lower((string) $this->input('email')),
        ]);
    }
}
