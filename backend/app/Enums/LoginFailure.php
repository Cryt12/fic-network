<?php

namespace App\Enums;

/**
 * Why a login attempt failed (failed_login_attempts.reason).
 */
enum LoginFailure: string
{
    case WrongPassword = 'wrong_password';
    case UnknownEmail = 'unknown_email';
    case LockedOut = 'locked_out'; // tried again while blocked for too many wrong passwords
}
