<?php

namespace App\Http\Requests;

use App\Enums\UserRoleGroup;
use App\Models\UserRole;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StoreUserRoleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('manage-user-directories') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', Rule::unique(UserRole::class, 'name')],
            'display_name' => ['required', 'string', 'max:255', Rule::unique(UserRole::class, 'display_name')],
            'organization_group' => ['required', Rule::enum(UserRoleGroup::class)],
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'display_name' => Str::squish((string) $this->input('display_name')),
            'name' => Str::slug((string) $this->input('display_name')),
        ]);
    }
}
