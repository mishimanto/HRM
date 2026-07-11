<?php

namespace Tests\Feature;

use App\Services\IntegrationDispatcher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class IntegrationDispatcherTest extends TestCase
{
    use RefreshDatabase;

    public function test_webhook_is_signed_and_delivery_is_recorded(): void
    {
        Http::fake(['https://example.test/*' => Http::response(['ok' => true], 200)]);
        $this->createWebhook('Test', 'approval.updated');

        app(IntegrationDispatcher::class)->dispatch('approval.updated', ['id' => 1]);

        Http::assertSent(fn ($request) => $request->hasHeader('X-HRM-Signature') && $request['event'] === 'approval.updated');
        $this->assertDatabaseHas('integration_deliveries', ['event' => 'approval.updated', 'status' => 'delivered', 'response_status' => 200]);
    }

    public function test_failed_delivery_can_be_retried_with_original_payload(): void
    {
        Http::fakeSequence()->push('down', 500)->push(['ok' => true], 200);
        $this->createWebhook('Retry', 'employee.updated');
        $dispatcher = app(IntegrationDispatcher::class);

        $dispatcher->dispatch('employee.updated', ['employee_id' => 7]);
        $retried = $dispatcher->retry(DB::table('integration_deliveries')->first()->id);

        $this->assertSame('delivered', $retried->status);
        $this->assertSame(2, $retried->attempt);
        $this->assertDatabaseCount('integration_deliveries', 2);
        Http::assertSentCount(2);
    }

    private function createWebhook(string $name, string $event): void
    {
        DB::table('integration_webhooks')->insert([
            'name' => $name,
            'url' => 'https://example.test/hrm',
            'secret' => Crypt::encryptString('1234567890123456'),
            'events' => json_encode([$event]),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
