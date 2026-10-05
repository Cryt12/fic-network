<?php

namespace Tests\Unit;

use App\Support\NameMasker;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class NameMaskerTest extends TestCase
{
    /**
     * @return array<string, array{string, string}>
     */
    public static function names(): array
    {
        return [
            'long name keeps 4 chars' => ['DOST Caraga', 'DOST***'],
            'five chars' => ['Maria', 'Mari***'],
            'exactly four chars keeps 1' => ['Juan', 'J***'],
            'short name keeps 1' => ['Al', 'A***'],
            'single char' => ['X', 'X***'],
            'multibyte safe' => ['Ñoño Peña', 'Ñoño***'],
            'surrounding whitespace ignored' => ['  Rosario  ', 'Rosa***'],
            'no space before the stars' => ['Mae Ann Lagura', 'Mae***'],
        ];
    }

    #[DataProvider('names')]
    public function test_it_masks_names(string $name, string $expected): void
    {
        $this->assertSame($expected, NameMasker::mask($name));
    }
}
