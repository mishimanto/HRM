<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentController extends Controller
{
    public function index(Request $request)
    {
        $documents = Document::with('employee.user')
            ->when($request->employee_id, function($query, $employeeId) {
                $query->where('employee_id', $employeeId);
            })
            ->when($request->document_type, function($query, $documentType) {
                $query->where('document_type', $documentType);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($documents);
    }

    public function store(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'title' => 'required|string|max:255',
            'document_type' => 'required|in:resume,contract,certificate,id_proof,experience_letter,education_certificate,other',
            'file' => 'required|file|max:10240', // 10MB max
            'description' => 'nullable|string',
            'expiry_date' => 'nullable|date',
        ]);

        $file = $request->file('file');
        $fileName = Str::random(20) . '_' . time() . '.' . $file->getClientOriginalExtension();
        $filePath = $file->storeAs('employee-documents', $fileName, 'local');

        $document = Document::create([
            'employee_id' => $request->employee_id,
            'title' => $request->title,
            'file_path' => $filePath,
            'file_name' => $file->getClientOriginalName(),
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'document_type' => $request->document_type,
            'description' => $request->description,
            'expiry_date' => $request->expiry_date,
            'uploaded_by' => $request->user()->id,
            'storage_disk' => 'local',
        ]);

        return response()->json([
            'document' => $document->load('employee.user'),
            'message' => 'Document uploaded successfully'
        ], 201);
    }

    public function show(Document $document)
    {
        return response()->json([
            'document' => $document->load('employee.user')
        ]);
    }

    public function download(Request $request, Document $document)
    {
        $this->authorizeDocument($request, $document);
        $disk = $document->storage_disk ?: 'public';
        if (!Storage::disk($disk)->exists($document->file_path)) {
            return response()->json([
                'message' => 'File not found'
            ], 404);
        }

        return Storage::disk($disk)->download($document->file_path, $document->file_name);
    }

    public function update(Request $request, Document $document)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'document_type' => 'required|in:resume,contract,certificate,id_proof,experience_letter,education_certificate,other',
            'description' => 'nullable|string',
            'expiry_date' => 'nullable|date',
            'is_verified' => 'boolean',
        ]);

        $values = $request->only(['title','document_type','description','expiry_date','is_verified']);
        if ($request->boolean('is_verified') && !$document->is_verified) {
            $values['verified_by'] = $request->user()->id;
            $values['verified_at'] = now();
        }
        $document->update($values);

        return response()->json([
            'document' => $document->load('employee.user'),
            'message' => 'Document updated successfully'
        ]);
    }

    public function destroy(Document $document)
    {
        // Delete file from storage
        Storage::disk($document->storage_disk ?: 'public')->delete($document->file_path);
        
        $document->delete();

        return response()->json([
            'message' => 'Document deleted successfully'
        ]);
    }

    public function employeeDocuments(Request $request)
    {
        $employee = Employee::where('user_id', $request->user()->id)->first();

        if (!$employee) {
            return response()->json([
                'message' => 'Employee record not found'
            ], 404);
        }

        $documents = Document::where('employee_id', $employee->id)
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json($documents);
    }

    public function expiring(Request $request)
    {
        $days = $request->integer('days', 30);
        return Document::with('employee.user')->whereNotNull('expiry_date')->whereBetween('expiry_date', [today(), today()->addDays($days)])->orderBy('expiry_date')->get();
    }

    private function authorizeDocument(Request $request, Document $document): void
    {
        if ($request->user()->hasPermission('document.manage')) return;
        abort_unless($request->user()->employee?->id === $document->employee_id, 403, 'You cannot access this document');
    }
}
