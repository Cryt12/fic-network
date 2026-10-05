<?php

namespace App\Support;

/**
 * Privacy mask for names shown to other users: "DOST Caraga" => "DOST***".
 *
 * Names of 4 characters or fewer keep only their first character ("Juan" => "J***"),
 * otherwise the mask would reveal the whole name.
 */
class NameMasker
{
    public static function mask(string $name): string
    {
        $name = trim($name);
        $visible = mb_strlen($name) > 4 ? 4 : 1;

        // rtrim: "Mae Ann" => "Mae***", not "Mae ***".
        return rtrim(mb_substr($name, 0, $visible)).'***';
    }
}
