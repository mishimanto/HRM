<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Invalid login credentials'
            ], 401);
        }

        if (!Auth::user()->is_active) {
            Auth::logout();

            return response()->json([
                'message' => 'Your account is inactive. Contact HR.'
            ], 403);
        }

        $user = User::where('email', $request->email)->firstOrFail();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user->load(['role', 'employee.department', 'employee.position']),
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    public function user(Request $request)
    {
        return response()->json([
            'user' => $request->user()->load(['role', 'employee.department', 'employee.position'])
        ]);
    }

    public function updateProfile(Request $request)
{
    $user = $request->user();

    $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|max:255|unique:users,email,'.$user->id,
        'phone' => 'nullable|string|max:20',
        'address' => 'nullable|string|max:500',
        'date_of_birth' => 'nullable|date',
    ]);

    $user->fill([
        'name' => $request->name,
        'email' => $request->email,
        'phone' => $request->phone,
        'address' => $request->address,
        'date_of_birth' => $request->date_of_birth,
    ])->save();

    return response()->json([
        'user' => $user->load(['role', 'employee.department', 'employee.position']),
        'message' => 'Profile updated successfully'
    ]);
}

public function changePassword(Request $request)
{
    $user = $request->user();

    $request->validate([
        'current_password' => ['required'],
        'password' => ['required', 'confirmed', Rules\Password::defaults()],
    ]);

    if (!Hash::check($request->current_password, $user->getAuthPassword())) {
        return response()->json([
            'message' => 'Current password is incorrect'
        ], 422);
    }

    $user->password = Hash::make($request->password);
    $user->save();

    return response()->json([
        'message' => 'Password changed successfully'
    ]);
}
}
