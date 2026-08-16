<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAttachmentTypeRequest;
use App\Http\Requests\UpdateAttachmentTypeRequest;
use App\Models\AttachmentType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttachmentTypeController extends Controller
{
    public function store(StoreAttachmentTypeRequest $request): RedirectResponse
    {
        AttachmentType::query()->create([
            ...$request->validated(),
            'region_id' => $request->user()->region_id,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Attachment type created.')]);

        return back();
    }

    public function update(UpdateAttachmentTypeRequest $request, AttachmentType $attachmentType): RedirectResponse
    {
        $attachmentType->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Attachment type updated.')]);

        return back();
    }

    public function destroy(Request $request, AttachmentType $attachmentType): RedirectResponse
    {
        abort_unless(
            $request->user()->can('manage-forms')
                && $request->user()->canAccessRegion($attachmentType->region_id),
            403,
        );

        $attachmentType->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Attachment type deleted.')]);

        return back();
    }
}
