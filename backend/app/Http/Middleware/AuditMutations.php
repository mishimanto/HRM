<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuditMutations
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (!$request->isMethodSafe() && $request->user()) {
            AuditLog::create([
                'user_id' => $request->user()->id,
                'event' => strtolower($request->method()),
                'route' => optional($request->route())->getName() ?? $request->path(),
                'subject_type' => optional($request->route())->getActionName(),
                'subject_id' => $this->routeSubjectId($request),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'request_data' => $request->except(['password', 'password_confirmation', 'current_password']),
                'response_status' => $response->getStatusCode(),
            ]);
        }

        return $response;
    }

    private function routeSubjectId(Request $request): ?string
    {
        foreach ($request->route()?->parameters() ?? [] as $parameter) {
            if (is_object($parameter) && method_exists($parameter, 'getKey')) {
                return (string) $parameter->getKey();
            }
        }

        return null;
    }
}
