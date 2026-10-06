<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Local Timezone
    |--------------------------------------------------------------------------
    |
    | The timezone people think in. Timestamps are stored in UTC; this is used
    | for report timestamps and for the "submitted from / to" date filters.
    |
    */

    'timezone' => env('FIC_TIMEZONE', 'Asia/Manila'),

    /*
    |--------------------------------------------------------------------------
    | Superadmin Account
    |--------------------------------------------------------------------------
    |
    | Created (or reset) by Database\Seeders\SuperadminSeeder. There is no
    | other way to obtain the superadmin role, and public signup refuses
    | this email address.
    |
    */

    'superadmin' => [
        'name' => env('SUPERADMIN_NAME', 'FIC Superadmin'),
        'email' => env('SUPERADMIN_EMAIL'),
        'password' => env('SUPERADMIN_PASSWORD'),
    ],

];
