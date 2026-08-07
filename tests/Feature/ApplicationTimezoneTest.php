<?php

test('application uses Philippine Standard Time', function () {
    expect(config('app.timezone'))
        ->toBe('Asia/Manila')
        ->and(date_default_timezone_get())
        ->toBe('Asia/Manila')
        ->and(now()->timezoneName)
        ->toBe('Asia/Manila');
});
