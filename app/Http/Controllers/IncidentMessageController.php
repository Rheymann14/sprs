<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreIncidentMessageRequest;
use App\Models\Incident;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class IncidentMessageController extends Controller
{
    public function store(StoreIncidentMessageRequest $request, Incident $incident): RedirectResponse
    {
        $message = $incident->messages()->create([
            'user_id' => $request->user()->id,
            'message' => $request->validated('message'),
        ]);

        foreach ($request->file('attachments', []) as $attachment) {
            $message->attachments()->create([
                'attachment_type_id' => $request->validated('attachment_type_id'),
                'original_name' => $attachment->getClientOriginalName(),
                'path' => $attachment->store('incident-messages', 'public'),
                'mime_type' => $attachment->getMimeType() ?? 'application/octet-stream',
                'size' => $attachment->getSize(),
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Message sent.')]);

        return back();
    }
}
