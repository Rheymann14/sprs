<?php

namespace App\Http\Requests;

use App\Models\IncidentType;
use App\Models\Region;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreIncidentTypeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->region_id !== null
            && $this->user()->can('manage-forms');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $regionRules = ['required', 'string', Rule::exists(Region::class, 'id')];

        if (! $this->user()->isSuperAdmin()) {
            $regionRules[] = Rule::in([$this->user()->region_id]);
        }

        return [
            'region_id' => $regionRules,
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique(IncidentType::class)->where('region_id', $this->input('region_id')),
            ],
        ];
    }
}
