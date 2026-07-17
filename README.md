# Professional HRM

A full-stack Human Resource Management platform built for day-to-day HR operations, employee self-service, and Bangladesh-oriented workforce and payroll workflows.

The project uses a Laravel 12 REST API with Sanctum authentication and a React 19 + Vite frontend. It includes role-based access control, mutation audit logging, and separate workspaces for administration, talent, compensation, operations, documents, and employee services.

## Highlights

- Employee, department, position, role, and user management
- Attendance, shifts, check-in/check-out, and bulk attendance
- Leave requests, approval workflow, balances, holidays, and accrual support
- Payroll structures, payroll runs, tax slabs, bonuses, provident fund, loans, final settlement, and PDF payslips
- Recruitment, onboarding, offboarding, performance, and training workflows
- Tasks, comments, attachments, calendar, notifications, and announcements
- Expense, asset, benefit, grievance, survey, and approval management
- Employee self-service, personal documents, payslips, and profile management
- Reports, analytics, data import/export, site settings, and integration delivery tracking
- Bangladesh defaults for BDT, Asia/Dhaka, general shifts, and statutory leave policies

## Technology Stack

| Layer | Technology |
| --- | --- |
| Backend | PHP 8.2+, Laravel 12, Laravel Sanctum |
| Frontend | React 19, Vite 7, Tailwind CSS |
| Data fetching | Axios, TanStack Query |
| UI and charts | Headless UI, Heroicons, SweetAlert2, Chart.js, Recharts |
| Calendar | FullCalendar |
| Realtime | Laravel Echo, Pusher |
| Database | SQLite by default; MySQL and other Laravel-supported databases can be configured |
| Testing | PHPUnit 11, Playwright, ESLint |

## Project Structure

```text
HRM/
├── backend/             # Laravel API, migrations, seeders, services, and tests
├── frontend/            # React application and Playwright tests
├── README.md
└── hrm_deepseek (3).sql # Legacy/reference SQL dump; not required for a fresh setup
```

## Requirements

Install the following before starting:

- PHP 8.2 or newer with the extensions required by Laravel
- Composer 2
- Node.js 20 or newer and npm
- SQLite, or a configured MySQL database

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/mishimanto/HRM.git
cd HRM
```

### 2. Set up the backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Create the database tables and demo accounts:

```bash
php artisan migrate:fresh --seed
```

Create the public storage link, then start the API:

```bash
php artisan storage:link
php artisan serve
```

The API will be available at `http://127.0.0.1:8000`, with endpoints under `/api`.

> `migrate:fresh` drops existing tables. For an existing database that must be preserved, use `php artisan migrate` instead and seed only when appropriate.

### 3. Set up the frontend

Open another terminal from the project root:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

## Demo Credentials

These accounts are created by `php artisan migrate:fresh --seed`:

| Role | Email | Password | Typical access |
| --- | --- | --- | --- |
| Administrator | `admin@gmail.com` | `password` | Full system access and site settings |
| HR Manager | `hr@gmail.com` | `password` | Employee, payroll, policy, talent, and HR operations |
| Department Manager | `manager@gmail.com` | `password` | Team, attendance, leave, reports, performance, and approvals |
| Employee | `employee@gmail.com` | `password` | Self-service, attendance, leave, payslips, documents, and tasks |

Additional seeded employee accounts are `john@gmail.com`, `jane@gmail.com`, `mike@gmail.com`, and `sarah@gmail.com`; each uses `password`.

> These credentials are for local development and demonstrations only. Change or remove every default account before deploying the application publicly.

## Bangladesh Policy Defaults

The policy seeder creates the following starter configuration:

- Company currency: BDT
- Timezone: Asia/Dhaka
- General shift: 9:00 AM–6:00 PM with a 60-minute break and 10-minute grace period
- Casual Leave: 10 days
- Sick Leave: 14 days, with document support
- Earned Leave: based on 18 worked days, with carry-forward and encashment support
- Maternity Leave: 120 days after the configured minimum service period
- Leave Without Pay

These are configurable application defaults, not a substitute for a legal review of an organization's employment category, policies, and current Bangladesh labour requirements.

## Using MySQL

Create a database, then replace the database section in `backend/.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=hrm
DB_USERNAME=root
DB_PASSWORD=
```

Then run:

```bash
php artisan migrate:fresh --seed
```

## Background Jobs and Realtime Events

The default backend environment uses the database queue. Run a worker when queued jobs are needed:

```bash
cd backend
php artisan queue:work
```

Realtime UI updates use Laravel Echo and Pusher. Configure the backend broadcasting variables and add these keys to `frontend/.env` when realtime updates are enabled:

```env
VITE_PUSHER_APP_KEY=your-pusher-key
VITE_PUSHER_APP_CLUSTER=your-pusher-cluster
```

Without Pusher configuration, the core API and standard page refresh workflows can still be used.

## Common Commands

### Backend

```bash
cd backend
php artisan serve                # Start the API
php artisan queue:work           # Process queued jobs
php artisan migrate              # Apply pending migrations
php artisan db:seed              # Seed configured demo data
php artisan route:list           # Inspect API routes
php artisan optimize:clear       # Clear Laravel caches
composer test                    # Run the backend test suite
```

### Frontend

```bash
cd frontend
npm run dev                      # Start Vite development server
npm run lint                     # Run ESLint
npm run build                    # Create a production build
npm run preview                  # Preview the production build
npm run test:e2e                 # Run Playwright end-to-end tests
```

The Playwright configuration starts both the Laravel API on port `8000` and Vite on port `5173`. Seed the testable local database before running the end-to-end suite.

## API Authentication

The frontend signs in through `POST /api/login`. Laravel Sanctum returns a bearer token, which the frontend stores locally and sends in the `Authorization` header for protected requests. Public registration is disabled; authorized users are managed from within the HRM system.

For a direct API login test:

```bash
curl -X POST http://127.0.0.1:8000/api/login \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"password"}'
```

## Production Checklist

- Set `APP_ENV=production`, `APP_DEBUG=false`, and the correct `APP_URL`
- Use a production database and secure, unique credentials
- Change or delete all seeded demo users
- Set `VITE_API_BASE_URL` to the public API URL before `npm run build`
- Configure HTTPS, CORS, mail, queue, cache, storage, and broadcasting as required
- Run `php artisan migrate --force` during deployment
- Run a supervised queue worker when database queues are enabled
- Point the backend web root to `backend/public`, never to the backend project root
- Serve the generated `frontend/dist` files and configure SPA fallback to `index.html`
- Back up the database and uploaded documents regularly

## Security Notes

- Never commit a real `.env` file, API key, database password, or mail credential
- Rotate exposed credentials immediately
- Keep `APP_DEBUG=false` in production
- Review role permissions before onboarding real users
- Validate organization policies and payroll rules with qualified HR/legal professionals before production use

## License

This repository does not currently declare a project-specific license. Add a `LICENSE` file before distributing or open-sourcing the project.
