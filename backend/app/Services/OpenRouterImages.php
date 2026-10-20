<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Asks an OpenRouter image model for one picture (chat completions with image output).
 * Throws RuntimeException with a message fit to show the superadmin.
 */
class OpenRouterImages
{
    public static function configured(): bool
    {
        return filled(config('services.openrouter.key'));
    }

    /**
     * @param  ?string  $system  the system message (design technique and rules), if any
     * @param  list<string>  $referenceImages  file paths sent along with the prompt (e.g. logos)
     * @param  array{aspect_ratio: string, image_size: string}  $imageConfig
     * @return array{bytes: string, extension: string, cost: ?float}
     */
    public static function generate(string $model, ?string $system, string $prompt, array $referenceImages, array $imageConfig): array
    {
        if (! self::configured()) {
            throw new RuntimeException('OpenRouter is not set up: add OPENROUTER_API_KEY to backend/.env.');
        }

        $content = [['type' => 'text', 'text' => $prompt]];
        foreach ($referenceImages as $path) {
            $content[] = ['type' => 'image_url', 'image_url' => ['url' => 'data:'.mime_content_type($path).';base64,'.base64_encode((string) file_get_contents($path))]];
        }

        $messages = [...(filled($system) ? [['role' => 'system', 'content' => $system]] : []), ['role' => 'user', 'content' => $content]];
        $response = self::send($model, $messages, $imageConfig);

        // A model that refuses a separate system message gets it at the top of the prompt instead.
        // (A rejected request like this is not charged.)
        if ($response->status() === 400 && filled($system) && str_contains(strtolower((string) $response->json('error.message')), 'system')) {
            $content[0]['text'] = $system."\n\n---\n\n".$prompt;
            $response = self::send($model, [['role' => 'user', 'content' => $content]], $imageConfig);
        }

        if ($response->failed()) {
            $message = $response->json('error.message') ?? $response->reason();
            throw new RuntimeException(match ($response->status()) {
                401 => 'OpenRouter rejected the API key. Check OPENROUTER_API_KEY in backend/.env.',
                402 => 'The OpenRouter account is out of credits. Add credits at openrouter.ai, then try again.',
                429 => 'OpenRouter is rate-limiting requests. Wait a minute and try again.',
                default => "OpenRouter error ({$response->status()}): {$message}",
            });
        }

        $url = $response->json('choices.0.message.images.0.image_url.url');
        if (! is_string($url) || ! preg_match('#^data:image/(png|jpeg|webp);base64,(.+)$#s', $url, $match)) {
            $said = trim((string) $response->json('choices.0.message.content'));
            throw new RuntimeException('The model did not return an image.'.($said !== '' ? ' It said: '.mb_strimwidth($said, 0, 300, '...') : ''));
        }

        $bytes = base64_decode($match[2], true);
        if ($bytes === false || @getimagesizefromstring($bytes) === false) {
            throw new RuntimeException('The model returned an image that could not be read.');
        }

        $cost = $response->json('usage.cost');

        return ['bytes' => $bytes, 'extension' => $match[1] === 'jpeg' ? 'jpg' : $match[1], 'cost' => is_numeric($cost) ? (float) $cost : null];
    }

    /**
     * @param  list<array<string, mixed>>  $messages
     * @param  array<string, string>  $imageConfig
     */
    private static function send(string $model, array $messages, array $imageConfig): Response
    {
        try {
            return Http::withToken(config('services.openrouter.key'))
                ->withHeaders(['HTTP-Referer' => config('app.url'), 'X-Title' => config('app.name')])
                ->timeout(config('services.openrouter.timeout'))
                ->acceptJson()
                ->post(rtrim(config('services.openrouter.url'), '/').'/chat/completions', [
                    'model' => $model,
                    'messages' => $messages,
                    'modalities' => ['image', 'text'],
                    'image_config' => $imageConfig,
                    'usage' => ['include' => true],
                ]);
        } catch (ConnectionException $e) {
            throw new RuntimeException('Could not reach OpenRouter (it may have timed out). Try again in a moment.', previous: $e);
        }
    }
}
