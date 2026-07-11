<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeLoan;
use App\Models\LoanInstallment;
use App\Models\PayrollItem;
use App\Models\PayrollRun;
use App\Services\BangladeshPayrollCalculator;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PayrollEngineController extends Controller
{
    public function overview(Request $request)
    {
        return response()->json([
            'runs' => PayrollRun::withCount('items')->orderByDesc('period_start')->limit(30)->get(),
            'components' => DB::table('salary_components')->where('is_active', true)->orderBy('type')->get(),
            'structures' => DB::table('salary_structures')->where('is_active', true)->get(),
            'loans' => DB::table('employee_loans as l')->join('employees as e','e.id','=','l.employee_id')->join('users as u','u.id','=','e.user_id')->select('l.*','u.name as employee_name')->orderByDesc('l.id')->limit(50)->get(),
            'bonuses' => DB::table('employee_bonuses as b')->join('employees as e','e.id','=','b.employee_id')->join('users as u','u.id','=','e.user_id')->select('b.*','u.name as employee_name')->orderByDesc('b.id')->limit(50)->get(),
            'settlements' => DB::table('final_settlements as f')->join('employees as e','e.id','=','f.employee_id')->join('users as u','u.id','=','e.user_id')->select('f.*','u.name as employee_name')->orderByDesc('f.id')->limit(50)->get(),
        ]);
    }
    public function components() { return DB::table('salary_components')->where('is_active', true)->orderBy('type')->get(); }

    public function storeComponent(Request $request)
    {
        $data = $request->validate([
            'company_id' => 'nullable|exists:companies,id', 'name' => 'required|string|max:255', 'code' => 'required|string|max:50',
            'type' => 'required|in:earning,deduction,employer_contribution', 'calculation_type' => 'required|in:fixed,percentage',
            'percentage_of' => 'nullable|in:gross,basic', 'default_value' => 'required|numeric|min:0',
            'is_taxable' => 'sometimes|boolean', 'is_basic' => 'sometimes|boolean', 'is_statutory' => 'sometimes|boolean',
        ]);
        $id = DB::table('salary_components')->insertGetId(array_merge($data, ['created_at' => now(), 'updated_at' => now()]));
        return response()->json(DB::table('salary_components')->find($id), 201);
    }

    public function structures() { return DB::table('salary_structures')->where('is_active', true)->get(); }

    public function storeStructure(Request $request)
    {
        $data = $request->validate([
            'company_id' => 'nullable|exists:companies,id', 'name' => 'required|string|max:255', 'code' => 'required|string|max:50',
            'description' => 'nullable|string', 'components' => 'required|array|min:1',
            'components.*.salary_component_id' => 'required|exists:salary_components,id', 'components.*.value' => 'required|numeric|min:0',
        ]);
        return DB::transaction(function () use ($data) {
            $id = DB::table('salary_structures')->insertGetId(['company_id' => $data['company_id'] ?? null, 'name' => $data['name'], 'code' => $data['code'], 'description' => $data['description'] ?? null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]);
            foreach ($data['components'] as $component) DB::table('salary_structure_components')->insert(array_merge($component, ['salary_structure_id' => $id, 'created_at' => now(), 'updated_at' => now()]));
            return response()->json(['id' => $id, 'message' => 'Salary structure created'], 201);
        });
    }

    public function assignStructure(Request $request)
    {
        $data = $request->validate([
            'employee_id' => 'required|exists:employees,id', 'salary_structure_id' => 'required|exists:salary_structures,id',
            'gross_salary' => 'required|numeric|min:0', 'effective_from' => 'required|date', 'effective_to' => 'nullable|date|after_or_equal:effective_from',
            'component_overrides' => 'nullable|array',
        ]);
        $data['component_overrides'] = isset($data['component_overrides']) ? json_encode($data['component_overrides']) : null;
        $data['approved_by'] = $request->user()->id; $data['created_at'] = now(); $data['updated_at'] = now();
        return response()->json(['id' => DB::table('employee_salary_structures')->insertGetId($data)], 201);
    }

    public function taxSlabs(Request $request) { return DB::table('tax_slabs')->when($request->assessment_year, fn ($q, $v) => $q->where('assessment_year', $v))->orderBy('sequence')->get(); }

    public function storeTaxSlabs(Request $request)
    {
        $data = $request->validate(['assessment_year' => 'required|string|max:20', 'taxpayer_category' => 'required|in:general,female_senior,disabled,war_wounded,third_gender', 'slabs' => 'required|array|min:1', 'slabs.*.amount' => 'nullable|numeric|min:0', 'slabs.*.rate' => 'required|numeric|min:0|max:100']);
        DB::transaction(function () use ($data) {
            DB::table('tax_slabs')->where('assessment_year', $data['assessment_year'])->where('taxpayer_category', $data['taxpayer_category'])->delete();
            foreach ($data['slabs'] as $index => $slab) DB::table('tax_slabs')->insert(['assessment_year' => $data['assessment_year'], 'taxpayer_category' => $data['taxpayer_category'], 'sequence' => $index + 1, 'amount' => $slab['amount'], 'rate' => $slab['rate'], 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]);
        });
        return response()->json(['message' => 'Tax slabs saved']);
    }

    public function runs() { return PayrollRun::withCount('items')->orderByDesc('period_start')->paginate(20); }

    public function storeRun(Request $request)
    {
        $data = $request->validate(['company_id' => 'nullable|exists:companies,id', 'branch_id' => 'nullable|exists:branches,id', 'name' => 'required|string|max:255', 'period_start' => 'required|date', 'period_end' => 'required|date|after_or_equal:period_start', 'payment_date' => 'required|date|after_or_equal:period_end']);
        $data['created_by'] = $request->user()->id;
        return response()->json(PayrollRun::create($data), 201);
    }

    public function calculate(Request $request, PayrollRun $payrollRun, BangladeshPayrollCalculator $calculator)
    {
        abort_unless(in_array($payrollRun->status, ['draft', 'calculated'], true), 422, 'Only draft or calculated runs can be recalculated');
        $assessmentYear = $request->validate(['assessment_year' => 'required|string|max:20'])['assessment_year'];
        $employees = Employee::query()->when($payrollRun->company_id, fn ($q) => $q->where('company_id', $payrollRun->company_id))->when($payrollRun->branch_id, fn ($q) => $q->where('branch_id', $payrollRun->branch_id))->whereHas('user', fn ($q) => $q->where('is_active', true))->get();
        $errors = [];
        DB::transaction(function () use ($employees, $payrollRun, $calculator, $assessmentYear, &$errors) {
            foreach ($employees as $employee) {
                try {
                    $values = $calculator->calculate($employee, Carbon::parse($payrollRun->period_start), Carbon::parse($payrollRun->period_end), $assessmentYear);
                    PayrollItem::updateOrCreate(['payroll_run_id' => $payrollRun->id, 'employee_id' => $employee->id], $values);
                } catch (\Throwable $e) { $errors[$employee->id] = $e->getMessage(); }
            }
            $payrollRun->update(['status' => 'calculated']);
        });
        return response()->json(['run' => $payrollRun->fresh()->load('items.employee.user'), 'errors' => $errors]);
    }

    public function approve(Request $request, PayrollRun $payrollRun)
    {
        abort_unless($payrollRun->status === 'calculated' && $payrollRun->items()->exists(), 422, 'Calculated payroll items are required');
        $payrollRun->update(['status' => 'approved', 'approved_by' => $request->user()->id, 'approved_at' => now()]);
        return $payrollRun;
    }

    public function markPaid(PayrollRun $payrollRun)
    {
        abort_unless($payrollRun->status === 'approved', 422, 'Payroll must be approved first');
        DB::transaction(function () use ($payrollRun) {
            foreach ($payrollRun->items as $item) {
                $ids = $item->calculation_meta['loan_installment_ids'] ?? [];
                LoanInstallment::whereIn('id', $ids)->update(['status' => 'paid', 'payroll_item_id' => $item->id, 'paid_at' => now()]);
                DB::table('provident_fund_transactions')->insertOrIgnore([
                    ['employee_id'=>$item->employee_id,'payroll_item_id'=>$item->id,'type'=>'employee_contribution','amount'=>$item->provident_fund_employee,'transaction_date'=>$payrollRun->payment_date,'created_at'=>now(),'updated_at'=>now()],
                    ['employee_id'=>$item->employee_id,'payroll_item_id'=>$item->id,'type'=>'employer_contribution','amount'=>$item->provident_fund_employer,'transaction_date'=>$payrollRun->payment_date,'created_at'=>now(),'updated_at'=>now()],
                ]);
                $bonusIds=$item->calculation_meta['bonus_ids']??[];DB::table('employee_bonuses')->whereIn('id',$bonusIds)->update(['status'=>'paid','payroll_item_id'=>$item->id,'updated_at'=>now()]);
            }
            $payrollRun->update(['status' => 'paid', 'paid_at' => now()]);
        });
        return $payrollRun->fresh();
    }

    public function payslip(PayrollItem $payrollItem) { return $payrollItem->load(['employee.user', 'employee.department', 'employee.position', 'run']); }

    public function payslipPdf(Request $request, PayrollItem $payrollItem)
    {
        $payrollItem->load(['employee.user','employee.company','employee.department','employee.position','run']);
        abort_unless($request->user()->hasPermission('payroll.manage') || $request->user()->employee?->id === $payrollItem->employee_id, 403);
        abort_unless(in_array($payrollItem->run->status, ['approved','paid'], true), 422, 'Payslip is not released');
        $options = new \Dompdf\Options(); $options->set('defaultFont', 'DejaVu Sans');
        $pdf = new \Dompdf\Dompdf($options); $pdf->loadHtml(view('payslip', ['item'=>$payrollItem])->render()); $pdf->setPaper('A4'); $pdf->render();
        return response($pdf->output(), 200, ['Content-Type'=>'application/pdf','Content-Disposition'=>'attachment; filename="payslip-'.$payrollItem->id.'.pdf"']);
    }

    public function myPayslips(Request $request)
    {
        abort_unless($request->user()->employee, 404, 'Employee record not found');
        return PayrollItem::with('run')->where('employee_id', $request->user()->employee->id)->whereHas('run', fn ($q) => $q->whereIn('status', ['approved', 'paid']))->orderByDesc('id')->paginate(20);
    }

    public function storeLoan(Request $request)
    {
        $data = $request->validate(['employee_id' => 'required|exists:employees,id', 'type' => 'required|in:salary_advance,personal,emergency,other', 'principal' => 'required|numeric|min:1', 'interest_rate' => 'sometimes|numeric|min:0', 'installment_count' => 'required|integer|min:1|max:120', 'first_deduction_date' => 'required|date']);
        $total = $data['principal'] * (1 + (($data['interest_rate'] ?? 0) / 100));
        $data['installment_amount'] = round($total / $data['installment_count'], 2); $data['loan_number'] = 'LN-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));
        return response()->json(EmployeeLoan::create($data), 201);
    }

    public function storeBonus(Request $request)
    {
        $data = $request->validate(['employee_id'=>'required|exists:employees,id','type'=>'required|in:festival,performance,attendance,retention,other','name'=>'required|string|max:255','amount'=>'required|numeric|min:0','payment_date'=>'required|date','is_taxable'=>'sometimes|boolean']);
        $data += ['status'=>'approved','approved_by'=>$request->user()->id,'created_at'=>now(),'updated_at'=>now()];
        return response()->json(DB::table('employee_bonuses')->insertGetId($data), 201);
    }

    public function createFinalSettlement(Request $request)
    {
        $data=$request->validate(['employee_id'=>'required|exists:employees,id','last_working_date'=>'required|date','notice_pay'=>'sometimes|numeric','bonus_due'=>'sometimes|numeric']);
        $employee=Employee::findOrFail($data['employee_id']);
        $salary=DB::table('employee_salary_structures')->where('employee_id',$employee->id)->whereDate('effective_from','<=',$data['last_working_date'])->orderByDesc('effective_from')->first();
        abort_unless($salary,422,'Employee has no salary structure');
        $gross=(float)$salary->gross_salary;$serviceYears=max(0,Carbon::parse($employee->joining_date)->floatDiffInYears(Carbon::parse($data['last_working_date'])));
        $settings=json_decode(DB::table('companies')->where('id',$employee->company_id)->value('settings')??'{}',true)?:[];
        $gratuityDays=(float)($settings['gratuity_days_per_year']??30);$gratuity=round(($gross/30)*$gratuityDays*floor($serviceYears),2);
        $leaveDays=DB::table('leave_balances')->where('employee_id',$employee->id)->get()->sum(fn($b)=>(float)$b->opening_balance+(float)$b->accrued+(float)$b->adjusted-(float)$b->used-(float)$b->encashed);
        $leaveEncashment=round(max(0,$leaveDays)*$gross/30,2);
        $loanDue=DB::table('loan_installments as i')->join('employee_loans as l','l.id','=','i.employee_loan_id')->where('l.employee_id',$employee->id)->where('i.status','pending')->sum(DB::raw('i.principal_amount+i.interest_amount'));
        $values=['employee_id'=>$employee->id,'last_working_date'=>$data['last_working_date'],'salary_due'=>$gross,'leave_encashment'=>$leaveEncashment,'gratuity'=>$gratuity,'provident_fund'=>DB::table('provident_fund_transactions')->where('employee_id',$employee->id)->sum('amount'),'notice_pay'=>$data['notice_pay']??0,'bonus_due'=>$data['bonus_due']??0,'deductions'=>$loanDue];
        $values['net_settlement']=array_sum(array_intersect_key($values,array_flip(['salary_due','leave_encashment','gratuity','provident_fund','notice_pay','bonus_due'])))-$loanDue;
        $values['calculation_meta']=json_encode(['service_years'=>$serviceYears,'gratuity_days_per_year'=>$gratuityDays,'encashed_leave_days'=>$leaveDays]);$values['created_at']=now();$values['updated_at']=now();
        $id=DB::table('final_settlements')->insertGetId($values);return response()->json(DB::table('final_settlements')->find($id),201);
    }
}
