<?php

use Inertia\Testing\AssertableInertia as Assert;

test('welcome page can be rendered', function () {
    $response = $this->get(route('home'));

    $response->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('welcome'));
});
