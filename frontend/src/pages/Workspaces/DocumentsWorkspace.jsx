import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ToastAlert from '../../components/UI/ToastAlert';
import SharedStatCard from '../../components/UI/StatCard';
import {
  ArrowDownTrayIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  FolderOpenIcon,
  PlusIcon,
  ShieldCheckIcon,
  TrashIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { documentService } from '../../services/documentService';
import { employeeService } from '../../services/employeeService';
import { confirmDialog } from '../../utils/dialog';

const documentTypes = [
  'contract',
  'resume',
  'certificate',
  'id_proof',
  'experience_letter',
  'education_certificate',
  'other',
];

export default function DocumentsWorkspace() {
  const [docs, setDocs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [documentResponse, employeeResponse, expiringResponse] = await Promise.all([
        documentService.all(),
        employeeService.getAll(),
        documentService.expiring(30),
      ]);
      setDocs(documentResponse.data.data || []);
      setEmployees(employeeResponse.data.data || []);
      setExpiring(expiringResponse.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => ({
    total: docs.length,
    verified: docs.filter(doc => doc.is_verified).length,
    pending: docs.filter(doc => !doc.is_verified).length,
    expiring: expiring.length,
  }), [docs, expiring.length]);

  const upload = async event => {
    event.preventDefault();
    setError('');
    try {
      await documentService.upload(new FormData(event.currentTarget));
      setModal(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    }
  };

  const verifyDocument = async document => {
    try {
      await documentService.verify(document.id, document);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    }
  };

  const removeDocument = async document => {
    const confirmed = await confirmDialog({
      title: 'Delete document?',
      text: `${document.title} will be removed from the register.`,
      confirmButtonText: 'Delete document',
      danger: true,
    });
    if (!confirmed) return;

    try {
      await documentService.remove(document.id);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="text-center">
          <div className="professional-loader mx-auto" />
          <p className="mt-3 text-sm font-medium text-slate-500">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden border border-slate-900/10 bg-[linear-gradient(135deg,#0f2137_0%,#123352_55%,#0f766e_100%)] p-6 text-white shadow-[0_28px_60px_rgba(15,33,55,0.26),0_8px_0_rgba(15,33,55,0.10)] sm:p-7">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-300 via-amber-300 to-rose-400" />
        <div className="absolute bottom-0 right-0 h-28 w-80 -skew-x-12 bg-white/10" />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-black">Employee Documents</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden items-center gap-3 border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-cyan-50/85 sm:flex">
              <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-teal-400" /> Verified</span>
              <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-amber-300" /> Pending</span>
            </div>
            <button onClick={() => setModal(true)} className="inline-flex h-11 items-center gap-2 bg-teal-400 px-4 text-sm font-black text-slate-950 shadow-[0_12px_22px_rgba(15,118,110,0.20)] hover:bg-teal-300">
              <PlusIcon className="h-4 w-4" />
              Upload
            </button>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-teal-400 via-amber-300 to-rose-400" />
      </section>

      {error && <Alert type="error" message={error} />}
      {expiring.length > 0 && <Alert type="warning" message={`${expiring.length} document${expiring.length > 1 ? 's' : ''} expire within 30 days. Review renewals before their expiry date.`} />}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Documents" value={summary.total} icon={FolderOpenIcon} theme="teal" />
        <SummaryCard label="Verified" value={summary.verified} icon={CheckCircleIcon} theme="indigo" />
        <SummaryCard label="Pending" value={summary.pending} icon={ShieldCheckIcon} theme="amber" />
        <SummaryCard label="Expiring Soon" value={summary.expiring} icon={ExclamationTriangleIcon} theme="rose" />
      </div>

      <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
        <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Document Register</h2>
          </div>
          <span className="w-fit border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 shadow-sm">
            {docs.length} documents
          </span>
        </div>

        <div className="overflow-x-auto">
          {docs.length === 0 ? (
            <div className="p-10 text-center">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-3 text-sm font-bold text-slate-900">No employee documents</h3>
              <p className="mt-1 text-sm text-slate-500">Upload a document to start maintaining employee records.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/90">
                <tr>
                  <HeadCell>Document</HeadCell>
                  <HeadCell>Employee</HeadCell>
                  <HeadCell>Type</HeadCell>
                  <HeadCell>Expiry</HeadCell>
                  <HeadCell>Status</HeadCell>
                  <HeadCell align="right">Actions</HeadCell>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white/80">
                {docs.map(document => (
                  <tr key={document.id} className="transition hover:bg-teal-50/40">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex min-w-[240px] items-center">
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[8px] bg-teal-600 shadow-[0_12px_22px_rgba(15,118,110,0.25)]">
                          <DocumentTextIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-4 min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">{document.title}</p>
                          <p className="mt-1 truncate text-sm text-slate-500">{document.file_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                        <UserCircleIcon className="h-5 w-5 text-slate-400" />
                        {document.employee?.user?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap"><Badge style="border-indigo-200 bg-indigo-50 text-indigo-800">{document.document_type}</Badge></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-slate-900">{formatDate(document.expiry_date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge style={document.is_verified ? 'border-teal-200 bg-teal-50 text-teal-800' : 'border-amber-200 bg-amber-50 text-amber-800'}>
                        {document.is_verified ? 'Verified' : 'Pending'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <IconButton title="Download" onClick={() => documentService.download(document.id, document.file_name)}>
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </IconButton>
                        {!document.is_verified && (
                          <IconButton title="Verify" tone="success" onClick={() => verifyDocument(document)}>
                            <CheckBadgeIcon className="h-4 w-4" />
                          </IconButton>
                        )}
                        <IconButton title="Delete" tone="danger" onClick={() => removeDocument(document)}>
                          <TrashIcon className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {modal && (
        <UploadModal
          employees={employees}
          onClose={() => setModal(false)}
          onSubmit={upload}
        />
      )}
    </div>
  );
}

function UploadModal({ employees, onClose, onSubmit }) {
  return (
    <div className="app-modal-backdrop">
      <form onSubmit={onSubmit} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[10px] border border-white/70 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.25)]">
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Upload Document</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 rounded-full items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="block text-sm font-bold text-slate-700 sm:col-span-2">
            Employee
            <select required name="employee_id" className="mt-2 h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100">
              <option value="">Select Employee</option>
              {employees.map(employee => <option key={employee.id} value={employee.id}>{employee.user?.name}</option>)}
            </select>
          </label>
          <Field name="title" label="Title" />
          <label className="block text-sm font-bold text-slate-700">
            Type
            <select name="document_type" className="mt-2 h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100">
              {documentTypes.map(type => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}
            </select>
          </label>
          <Field name="expiry_date" label="Expiry date" type="date" required={false} />
          <label className="block text-sm font-bold text-slate-700 sm:col-span-2">
            File
            <input required name="file" type="file" className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none file:mr-4 file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-black file:text-teal-800 hover:file:bg-teal-100 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100" />
          </label>
        </div>
        <div className="flex justify-end border-t border-slate-100 px-5 py-4">
          <button className="inline-flex items-center gap-2 bg-teal-600 px-4 py-2 text-sm font-black text-white shadow-[0_12px_22px_rgba(15,118,110,0.22)] hover:bg-teal-700">
            <PlusIcon className="h-4 w-4" />
            Upload
          </button>
        </div>
      </form>
    </div>
  );
}

function SummaryCard(props) {
  return <SharedStatCard {...props} />;
}

function HeadCell({ children, align }) {
  return <th className={`px-6 py-4 text-xs font-bold uppercase text-slate-500 whitespace-nowrap ${align === 'right' ? 'text-right' : 'text-left'}`}>{children}</th>;
}

function Badge({ children, style }) {
  return <span className={`inline-flex border px-2.5 py-1 text-xs font-bold capitalize shadow-sm ${style}`}>{String(children).replace('_', ' ')}</span>;
}

function IconButton({ children, title, onClick, tone = 'default' }) {
  const styles = {
    default: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100',
    success: 'border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-600 hover:text-white',
    danger: 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-600 hover:text-white',
  }[tone];

  return (
    <button title={title} onClick={onClick} className={`flex h-9 w-9 items-center justify-center border transition ${styles}`}>
      {children}
    </button>
  );
}

function Alert({ type = 'error', message }) {
  return <ToastAlert type={type} message={message} />;
}

function Field({ name, label, type = 'text', required = true }) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      <input required={required} name={name} type={type} className="mt-2 h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100" />
    </label>
  );
}

function formatDate(date) {
  if (!date) return '-';
  return String(date).slice(0, 10);
}
