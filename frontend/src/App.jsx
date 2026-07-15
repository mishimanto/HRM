import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SiteSettingsProvider } from './contexts/SiteSettingsContext';
import Layout from './components/Layout/Layout';
import ToastViewport from './components/UI/ToastViewport';
const Login=lazy(()=>import('./pages/Auth/Login'));const Dashboard=lazy(()=>import('./pages/Dashboard/Dashboard'));const Employees=lazy(()=>import('./pages/Employees/Employees'));const EmployeeFormPage=lazy(()=>import('./pages/Employees/EmployeeFormPage'));const Attendances=lazy(()=>import('./pages/Attendances/Attendances'));const MyAttendance=lazy(()=>import('./pages/Attendances/MyAttendance'));const Leaves=lazy(()=>import('./pages/Leaves/Leaves'));const Payrolls=lazy(()=>import('./pages/Payrolls/Payrolls'));const Departments=lazy(()=>import('./pages/Departments/Departments'));const Reports=lazy(()=>import('./pages/Reports/Reports'));const Calendar=lazy(()=>import('./pages/Calendar/Calendar'));const BulkAttendance=lazy(()=>import('./pages/BulkOperations/BulkAttendance'));const EditProfile=lazy(()=>import('./pages/Profile/EditProfile'));const ChangePassword=lazy(()=>import('./pages/Profile/ChangePassword'));const Tasks=lazy(()=>import('./pages/Tasks/Tasks'));const MyTasks=lazy(()=>import('./pages/Tasks/MyTasks'));const TaskDetail=lazy(()=>import('./pages/Tasks/TaskDetail'));const TaskFormPage=lazy(()=>import('./pages/Tasks/TaskFormPage'));const TalentWorkspace=lazy(()=>import('./pages/Workspaces/TalentWorkspace'));const EmployeeServicesWorkspace=lazy(()=>import('./pages/Workspaces/EmployeeServicesWorkspace'));const OperationsWorkspace=lazy(()=>import('./pages/Workspaces/OperationsWorkspace'));const CompensationWorkspace=lazy(()=>import('./pages/Workspaces/CompensationWorkspace'));const AdministrationWorkspace=lazy(()=>import('./pages/Workspaces/AdministrationWorkspace'));const SiteSettings=lazy(()=>import('./pages/Settings/SiteSettings'));const SelfServicePortal=lazy(()=>import('./pages/Workspaces/SelfServicePortal'));const DocumentsWorkspace=lazy(()=>import('./pages/Workspaces/DocumentsWorkspace'));const NotificationsPage=lazy(()=>import('./pages/Notifications/Notifications'));

// Protected Route - শুধু login check
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="professional-loader" />
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Role Protected Route - specific role check
const RoleProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="professional-loader" />
      </div>
    );
  }
  
  // যদি user না থাকে
  if (!user) {
    return <Navigate to="/login" />;
  }

  // যদি role restriction থাকে এবং user এর role allowed না হয়
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role_id)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="professional-loader" />
      </div>
    );
  }
  
  return !user ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <Router>
      <SiteSettingsProvider>
      <AuthProvider>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Loading workspace...</div>}><div className="App">
          <ToastViewport />
          <Routes>
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* Admin & HR Only Routes - Employee access করতে পারবে না */}
              <Route path="employees" element={
                <RoleProtectedRoute allowedRoles={[1, 2, 3]}> {/* Admin(1) & HR(2) */}
                  <Employees />
                </RoleProtectedRoute>
              } />
              <Route path="employees/create" element={
                <RoleProtectedRoute allowedRoles={[1, 2]}> {/* Admin & HR */}
                  <EmployeeFormPage />
                </RoleProtectedRoute>
              } />
              <Route path="employees/:id/edit" element={
                <RoleProtectedRoute allowedRoles={[1, 2]}> {/* Admin & HR */}
                  <EmployeeFormPage />
                </RoleProtectedRoute>
              } />
              
              <Route path="departments" element={
                <RoleProtectedRoute allowedRoles={[1, 2, 3]}> {/* Admin & HR */}
                  <Departments />
                </RoleProtectedRoute>
              } />
              
              <Route path="reports" element={
                <RoleProtectedRoute allowedRoles={[1, 2, 3]}> {/* Admin, HR & Manager(3) */}
                  <Reports />
                </RoleProtectedRoute>
              } />
              
              <Route path="bulk-attendance" element={
                <RoleProtectedRoute allowedRoles={[1, 2, 3]}> {/* Admin & HR */}
                  <BulkAttendance />
                </RoleProtectedRoute>
              } />
              
              <Route path="tasks" element={
                <RoleProtectedRoute allowedRoles={[1, 2, 3]}> {/* Admin, HR & Manager */}
                  <Tasks />
                </RoleProtectedRoute>
              } />
              <Route path="tasks/create" element={
                <RoleProtectedRoute allowedRoles={[1, 2, 3]}>
                  <TaskFormPage />
                </RoleProtectedRoute>
              } />
              <Route path="tasks/:id/edit" element={
                <RoleProtectedRoute allowedRoles={[1, 2, 3]}>
                  <TaskFormPage />
                </RoleProtectedRoute>
              } />
              <Route path="talent" element={<RoleProtectedRoute allowedRoles={[1, 2, 3]}><TalentWorkspace /></RoleProtectedRoute>} />
              
              {/* Common Routes - সব role access করতে পারবে */}
              <Route path="attendances" element={<Attendances />} />
              <Route path="my-attendance" element={<MyAttendance />} />
              <Route path="leaves" element={<Leaves />} />
              <Route path="payrolls" element={<Payrolls />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="profile/edit" element={<EditProfile />} />
              <Route path="profile/change-password" element={<ChangePassword />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="my-tasks" element={<MyTasks />} />
              <Route path="tasks/:id" element={<TaskDetail />} />
              <Route path="employee-services" element={<EmployeeServicesWorkspace />} />
              <Route path="operations" element={<RoleProtectedRoute allowedRoles={[1, 2, 3]}><OperationsWorkspace /></RoleProtectedRoute>} />
              <Route path="compensation" element={<RoleProtectedRoute allowedRoles={[1, 2]}><CompensationWorkspace /></RoleProtectedRoute>} />
              <Route path="administration" element={<RoleProtectedRoute allowedRoles={[1, 2]}><AdministrationWorkspace /></RoleProtectedRoute>} />
              <Route path="site-settings" element={<RoleProtectedRoute allowedRoles={[1]}><SiteSettings /></RoleProtectedRoute>} />
              <Route path="my-hr" element={<SelfServicePortal />} />
              <Route path="documents" element={<RoleProtectedRoute allowedRoles={[1, 2]}><DocumentsWorkspace /></RoleProtectedRoute>} />
            </Route>
          </Routes>
        </div></Suspense>
      </AuthProvider>
      </SiteSettingsProvider>
    </Router>
  );
}

export default App;
