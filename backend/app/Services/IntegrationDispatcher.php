<?php

namespace App\Services;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class IntegrationDispatcher
{
    public function dispatch(string $event, array $payload, ?int $companyId = null): void
    {
        $hooks = DB::table('integration_webhooks')
            ->where('is_active', true)
            ->where(fn ($query) => $query->whereNull('company_id')->when(
                $companyId,
                fn ($companyQuery) => $companyQuery->orWhere('company_id', $companyId)
            ))->get();

        foreach ($hooks as $hook) {
            $events = json_decode($hook->events, true) ?: [];
            if (in_array('*', $events, true) || in_array($event, $events, true)) {
                $this->deliver($hook, $event, $payload);
            }
        }
    }

    public function retry(int $deliveryId): object
    {
        $delivery = DB::table('integration_deliveries')->find($deliveryId);
        abort_unless($delivery, 404);
        abort_if($delivery->status !== 'failed', 422, 'Only failed deliveries can be retried.');
        abort_unless($delivery->payload, 422, 'This legacy delivery has no retry payload.');

        $hook = DB::table('integration_webhooks')->find($delivery->integration_webhook_id);
        abort_unless($hook && $hook->is_active, 422, 'The integration is inactive or missing.');

        return $this->deliver($hook, $delivery->event, json_decode($delivery->payload, true) ?: [], (int) $delivery->attempt + 1);
    }

    private function deliver(object $hook, string $event, array $payload, int $attempt = 1): object
    {
        $deliveryUuid = (string) Str::uuid();
        $body = ['id' => $deliveryUuid, 'event' => $event, 'occurred_at' => now()->toIso8601String(), 'data' => $payload];
        $record = [
            'integration_webhook_id' => $hook->id,
            'event' => $event,
            'payload' => json_encode($payload),
            'delivery_id' => $deliveryUuid,
            'attempt' => $attempt,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        try {
            $json = json_encode($body, JSON_THROW_ON_ERROR);
            $response = Http::timeout(5)->withHeaders([
                'X-HRM-Event' => $event,
                'X-HRM-Delivery' => $deliveryUuid,
                'X-HRM-Signature' => 'sha256='.hash_hmac('sha256', $json, Crypt::decryptString($hook->secret)),
            ])->withBody($json, 'application/json')->post($hook->url);
            $ok = $response->successful();
            $record += ['response_status' => $response->status(), 'status' => $ok ? 'delivered' : 'failed', 'error' => $ok ? null : $response->body(), 'delivered_at' => $ok ? now() : null];
            if ($ok) {
                DB::table('integration_webhooks')->where('id', $hook->id)->update(['last_triggered_at' => now(), 'updated_at' => now()]);
            }
        } catch (\Throwable $exception) {
            $record += ['status' => 'failed', 'error' => $exception->getMessage()];
        }

        $id = DB::table('integration_deliveries')->insertGetId($record);
        return DB::table('integration_deliveries')->find($id);
    }
}
