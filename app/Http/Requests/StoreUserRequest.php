<?php

namespace App\Http\Requests;

use App\Enums\UserRoleGroup;
use App\Models\Region;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Validator;

class StoreUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->region_id !== null
            && $this->user()->can('manage-users');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $regionRules = [
            'required',
            'string',
            Rule::exists(Region::class, 'id'),
        ];

        if (! $this->user()->isSuperAdmin()) {
            $regionRules[] = Rule::in([$this->user()->region_id]);
        }

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique(User::class, 'email')],
            'password' => ['required', 'string', Password::min(8)],
            'user_role' => [
                'required',
                'string',
                Rule::in(UserRole::assignableNamesFor($this->user())),
            ],
            'region_id' => $regionRules,
        ];
    }

    /** @return array<int, callable> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $roleName = $this->string('user_role')->toString();
                $regionId = $this->string('region_id')->toString();

                if ($roleName === '' || $regionId === '') {
                    return;
                }

                if (UserRole::groupForName($roleName) === UserRoleGroup::CentralOffice
                    && ! Region::query()->whereKey($regionId)->where('name', Region::CentralOffice)->exists()) {
                    $validator->errors()->add('region_id', __('Central Office roles must be assigned to CHED Central Office.'));
                }
            },
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
