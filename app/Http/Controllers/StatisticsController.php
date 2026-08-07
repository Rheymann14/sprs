<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class StatisticsController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('statistics', [
            'statistics' => [
                'total' => 0,
                'resolved' => 0,
                'pending' => 0,
                'unresolved' => 0,
            ],
        ]);
    }
}
