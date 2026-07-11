<?php

namespace Tests\Feature;

use App\Services\BangladeshPayrollCalculator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class BangladeshPayrollCalculatorTest extends TestCase
{
    use RefreshDatabase;

    public function test_progressive_tax_bands_are_applied_in_sequence(): void
    {
        foreach ([
            ['amount' => 350000, 'rate' => 0],
            ['amount' => 100000, 'rate' => 5],
            ['amount' => 400000, 'rate' => 10],
            ['amount' => null, 'rate' => 15],
        ] as $index => $slab) {
            DB::table('tax_slabs')->insert([
                'assessment_year' => 'TEST', 'taxpayer_category' => 'general',
                'sequence' => $index + 1, 'amount' => $slab['amount'], 'rate' => $slab['rate'],
                'is_active' => true, 'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        $tax = app(BangladeshPayrollCalculator::class)->annualTax(1_000_000, 'TEST');

        $this->assertSame(67_500.0, $tax);
    }

    public function test_missing_assessment_year_configuration_is_rejected(): void
    {
        $this->expectException(\RuntimeException::class);
        app(BangladeshPayrollCalculator::class)->annualTax(500_000, 'MISSING');
    }
}
