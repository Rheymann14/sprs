<?php

use Inertia\Testing\AssertableInertia as Assert;

test('welcome page can be rendered', function () {
    $response = $this->get(route('home'));

    $response->assertSuccessful()
        ->assertSee("const appearance = 'light';", false)
        ->assertInertia(fn (Assert $page) => $page->component('welcome'));
});

test('saved dark appearance is rendered immediately', function () {
    $response = $this->withUnencryptedCookie('appearance', 'dark')->get(route('home'));

    $response->assertSuccessful()
        ->assertSee('<html lang="en" class="dark">', false)
        ->assertSee("const appearance = 'dark';", false);
});
