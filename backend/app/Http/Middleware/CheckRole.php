<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated'
            ], 401);
        }

        if (!$user->is_active || !$user->role || !in_array($user->role->slug, $roles, true)) {
            return response()->json([
                'message' => 'Insufficient permissions'
            ], 403);
        }

        return $next($request);
    }
}
