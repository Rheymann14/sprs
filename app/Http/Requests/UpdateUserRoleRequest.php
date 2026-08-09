<?php

namespace App\Http\Requests;

use App\Enums\UserRoleGroup;
use App\Models\UserRole;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UpdateUserRoleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return ($this->user()?->can('manage-user-roles') ?? false)
            && $this->route('user_role') instanceof UserRole
            && ! $this->route('user_role')->is_system
            && ($this->user()->isSuperAdmin()
                || $this->route('user_role')->organization_group === $this->user()->roleGroup());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'display_name' => [
                'required',
                'string',
                'max:255',
                Rule::unique(UserRole::class, 'display_name')->ignore($this->route('user_role')),
            ],
            'organization_group' => [
                'required',
                Rule::enum(UserRoleGroup::class),
                Rule::when(
                    ! $this->user()->isSuperAdmin(),
                    Rule::in([$this->user()->roleGroup()?->value]),
                ),
            ],
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'display_name' => Str::squish((string) $this->input('display_name')),
        ]);
    }
}
