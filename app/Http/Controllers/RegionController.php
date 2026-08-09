<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRegionRequest;
use App\Models\Region;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class RegionController extends Controller
{
    public function store(StoreRegionRequest $request): RedirectResponse
    {
        Region::query()->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Region created.')]);

        return to_route('user-management.index', ['tab' => 'regions']);
    }

    public function destroy(Request $request, Region $region): RedirectResponse
    {
        abort_unless($request->user()?->can('manage-regions'), 403);

        if ($region->name === Region::CentralOffice) {
            throw ValidationException::withMessages([
                'region' => __('CHED Central Office cannot be deleted.'),
            ]);
        }

        if ($region->users()->exists() || $region->incidents()->exists() || $region->incidentForms()->exists()) {
            throw ValidationException::withMessages([
                'region' => __('This region cannot be deleted while application records are assigned to it.'),
            ]);
        }

        $region->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Region deleted.')]);

        return to_route('user-management.index', ['tab' => 'regions']);
    }
}
