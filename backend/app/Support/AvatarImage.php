<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Stores a profile photo. The upload is decoded and re-encoded with GD rather than saved as
 * sent: that drops EXIF data (GPS location, camera details), turns phone photos upright,
 * scales big photos down, and means only real image pixels ever reach the public disk.
 */
class AvatarImage
{
    /** Longest side, in pixels, of the stored photo. */
    private const MAX_SIDE = 512;

    /**
     * @return string the stored path on the "public" disk
     */
    public static function store(UploadedFile $file): string
    {
        $image = @imagecreatefromstring((string) file_get_contents($file->getRealPath()));
        if ($image === false) {
            throw new RuntimeException('The photo could not be read as an image.');
        }

        $image = self::upright($image, $file);
        $image = self::scaledDown($image);

        ob_start();
        imagewebp($image, null, 85);
        $contents = (string) ob_get_clean();
        imagedestroy($image);

        $path = 'avatars/'.Str::uuid().'.webp';
        Storage::disk('public')->put($path, $contents);

        return $path;
    }

    public static function delete(?string $path): void
    {
        if ($path !== null && str_starts_with($path, 'avatars/')) {
            Storage::disk('public')->delete($path);
        }
    }

    /** Phone cameras save photos sideways plus an EXIF "rotate me" flag; apply it. */
    private static function upright(\GdImage $image, UploadedFile $file): \GdImage
    {
        if (! function_exists('exif_read_data') || ! in_array($file->getMimeType(), ['image/jpeg', 'image/webp'], true)) {
            return $image;
        }

        $orientation = (int) (@exif_read_data($file->getRealPath())['Orientation'] ?? 1);
        $angle = match ($orientation) {
            3 => 180,
            6 => -90,
            8 => 90,
            default => 0,
        };

        return $angle === 0 ? $image : (imagerotate($image, $angle, 0) ?: $image);
    }

    private static function scaledDown(\GdImage $image): \GdImage
    {
        $width = imagesx($image);
        $height = imagesy($image);
        if (max($width, $height) <= self::MAX_SIDE) {
            return $image;
        }

        $scale = self::MAX_SIDE / max($width, $height);
        $scaled = imagescale($image, max(1, (int) round($width * $scale)), max(1, (int) round($height * $scale)), IMG_BICUBIC);

        return $scaled ?: $image;
    }
}
