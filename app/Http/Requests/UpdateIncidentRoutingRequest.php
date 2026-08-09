<?php

namespace App\Http\Requests;

use App\Models\Incident;
use App\Models\Region;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateIncidentRoutingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $incident = $this->route('incident');

        return $incident instanceof Incident
            && $this->user() !== null
            && $incident->routingIsManageableBy($this->user());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'region_ids' => ['present', 'array', 'max:100'],
            'region_ids.*' => ['required', 'string', 'distinct', Rule::in($this->allowedRegionIds())],
        ];
    }

    /** @return list<string> */
    private function allowedRegionIds(): array
    {
        $incident = $this->route('incident');

        if (! $incident instanceof Incident) {
            return [];
        }

        $originatesFromCentralOffice = $incident->region()
            ->where('name', Region::CentralOffice)
            ->exists();

        return Region::query()
            ->when(
                $originatesFromCentralOffice,
                fn ($query) => $query->where('name', '!=', Region::CentralOffice),
                fn ($query) => $query->where('name', Region::CentralOffice),
            )
            ->pluck('id')
            ->all();
    }
}
