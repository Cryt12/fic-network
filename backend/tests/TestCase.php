<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Behave like the SPA: Sanctum only starts a session for requests from a stateful origin.
        $this->withHeader('Origin', config('app.frontend_url'));
    }
}
