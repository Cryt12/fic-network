<?php

return [

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
