import api from './api';

export const talentService = {
  overview: () => api.get('/talent/overview'),
  createRequisition: (data) => api.post('/requisitions', data),
  createCandidate: (data) => api.post('/candidates', data),
  apply: (data) => api.post('/applications', data),
  scheduleInterview: (data) => api.post('/interviews', data),
  interviewResult: (id, data) => api.patch(`/interviews/${id}/result`, data),
  startOnboarding: (data) => api.post('/onboarding', data),
  completeOnboardingTask: (id) => api.patch(`/onboarding/tasks/${id}/complete`),
  createCycle: (data) => api.post('/performance/cycles', data),
  createGoal: (data) => api.post('/performance/goals', data),
  createReview: (data) => api.post('/performance/reviews', data),
  createCourse: (data) => api.post('/training/courses', data),
  enroll: (data) => api.post('/training/enrollments', data),
  completeTraining: (id, data) => api.patch(`/training/enrollments/${id}/complete`, data),
  startOffboarding: (data) => api.post('/offboarding', data),
  updateClearance: (id, data) => api.patch(`/offboarding/clearances/${id}`, data),
  updateRequisitionStatus: (id, status) => api.patch(`/requisitions/${id}/status`, { status }),
  updateApplicationStage: (id, stage) => api.patch(`/applications/${id}/stage`, { stage }),
};

export const employeeServices = {
  overview: () => api.get('/employee-services/overview'),
  createExpense: (data) => api.post('/expenses', data),
  updateExpense: (id, status) => api.patch(`/expenses/${id}/status`, { status }),
  createGrievance: (data) => api.post('/grievances', data),
  createAsset: (data) => api.post('/assets', data),
  assignAsset: (data) => api.post('/asset-assignments', data),
  returnAsset: (id, data) => api.patch(`/asset-assignments/${id}/return`, data),
  createBenefit: (data) => api.post('/benefit-plans', data),
  enrollBenefit: (data) => api.post('/benefit-enrollments', data),
  createAnnouncement: (data) => api.post('/announcements', data),
  createSurvey: (data) => api.post('/surveys', data),
  respondSurvey: (id, answers) => api.post(`/surveys/${id}/responses`, { answers }),
};
