<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    /*
     * Image reports (Generate Image Report, superadmin). The key stays on the server: the browser
     * never sees it. Only aggregate Dashboard numbers are sent, never names or emails.
     */
    'openrouter' => [
        'key' => env('OPENROUTER_API_KEY'),
        'url' => env('OPENROUTER_URL', 'https://openrouter.ai/api/v1'),
        // Models the superadmin may pick from, first one is the default.
        'image_models' => [
            'google/gemini-3-pro-image' => 'Best quality: Nano Banana Pro (about $0.13 at 2K, $0.24 at 4K)',
            'google/gemini-3.1-flash-image' => 'Cheaper: Nano Banana 2 (about $0.07 to $0.15)',
        ],
        'daily_limit' => (int) env('FIC_IMAGE_REPORTS_PER_DAY', 20),
        'timeout' => 240, // seconds to wait for one image
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
