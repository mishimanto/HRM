<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class SiteSettingController extends Controller
{
    public function show()
    {
        return response()->json($this->format($this->settings()));
    }

    public function update(Request $request)
    {
        abort_unless((int) $request->user()?->role_id === 1, 403, 'Only administrators can update site settings');

        $data = $request->validate([
            'site_name' => ['required', 'string', 'max:120'],
            'short_name' => ['required', 'string', 'max:30'],
            'tagline' => ['nullable', 'string', 'max:180'],
            'primary_color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'support_email' => ['nullable', 'email', 'max:120'],
            'support_phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
            'logo' => ['nullable', 'file', 'mimes:png,jpg,jpeg,webp,svg', 'max:2048'],
            'favicon' => ['nullable', 'file', 'mimes:png,jpg,jpeg,webp,ico,svg', 'max:1024'],
            'remove_logo' => ['nullable', Rule::in(['0', '1', 0, 1, true, false])],
            'remove_favicon' => ['nullable', Rule::in(['0', '1', 0, 1, true, false])],
        ]);

        $settings = $this->settings();

        if ($request->boolean('remove_logo') && $settings->logo_path) {
            Storage::disk('public')->delete($settings->logo_path);
            $data['logo_path'] = null;
        }

        if ($request->boolean('remove_favicon') && $settings->favicon_path) {
            Storage::disk('public')->delete($settings->favicon_path);
            $data['favicon_path'] = null;
        }

        if ($request->hasFile('logo')) {
            if ($settings->logo_path) Storage::disk('public')->delete($settings->logo_path);
            $data['logo_path'] = $request->file('logo')->store('site-settings', 'public');
        }

        if ($request->hasFile('favicon')) {
            if ($settings->favicon_path) Storage::disk('public')->delete($settings->favicon_path);
            $data['favicon_path'] = $request->file('favicon')->store('site-settings', 'public');
        }

        unset($data['logo'], $data['favicon'], $data['remove_logo'], $data['remove_favicon']);

        DB::table('site_settings')->where('id', $settings->id)->update($data + ['updated_at' => now()]);

        return response()->json($this->format($this->settings()));
    }

    private function settings()
    {
        $settings = DB::table('site_settings')->first();

        if (!$settings) {
            DB::table('site_settings')->insert([
                'site_name' => 'PeopleOS',
                'short_name' => 'HR',
                'tagline' => 'Human resource management',
                'primary_color' => '#0f766e',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $settings = DB::table('site_settings')->first();
        }

        return $settings;
    }

    private function format($settings): array
    {
        return [
            'id' => $settings->id,
            'site_name' => $settings->site_name,
            'short_name' => $settings->short_name,
            'tagline' => $settings->tagline,
            'logo_path' => $settings->logo_path,
            'logo_url' => $settings->logo_path ? asset('storage/'.$settings->logo_path) : null,
            'favicon_path' => $settings->favicon_path,
            'favicon_url' => $settings->favicon_path ? asset('storage/'.$settings->favicon_path) : null,
            'primary_color' => $settings->primary_color,
            'support_email' => $settings->support_email,
            'support_phone' => $settings->support_phone,
            'address' => $settings->address,
            'extra' => json_decode($settings->extra ?? '{}', true) ?: [],
            'updated_at' => $settings->updated_at,
        ];
    }
}
