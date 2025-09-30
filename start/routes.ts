/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import InertiaController from '#controllers/inertia_controller'
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import CoursesController from '#controllers/courses_controller'
import AuthController from '#controllers/auth_controller'
import AnalyticsController from '#controllers/analytics_controller'
import EarlyWarningSystemsController from '#controllers/early_warning_system_controller'
import EtlController from '#controllers/etl_controller'

// <-- GUEST INERTIA ROUTES -->
router.group(() => {
    router.get('/login', [InertiaController, 'login'])
}).use(middleware.guest())

// <-- AUTH INERTIA ROUTES -->
router.post('/fallback-login', [AuthController, 'fallbackLogin']).middleware([middleware.guest()]).prefix("/api/auth")
router.post('/adapt-login', [AuthController, 'adaptLogin']).middleware([middleware.guest()]).prefix("/api/auth")
router.post('/logout', [AuthController, 'logout']).middleware([middleware.auth()]).prefix("/api/auth")

// <-- INSTRUCTOR AND STUDENT INERTIA ROUTES -->
router.group(() => {
    router.get('/', [InertiaController, 'home'])
    router.get('/course-settings', [InertiaController, 'courseSettings'])
    router.get('/early-warning', [InertiaController, 'earlyWarning'])
    router.get('/learning-objectives', [InertiaController, 'learningObjectives'])
    router.get('/learning-curves', [InertiaController, 'learningCurves'])
    router.get('/raw-data', [InertiaController, 'rawData'])
}).use(middleware.auth())

// <-- NO AUTH REQ -->
router.group(() => {
    router.get('/health', (ctx) => {
        ctx.response.status(200).send({ status: 'ok' });
    });
    router.post('/etl/collect', [EtlController, 'runCollectors']);
    router.post('/etl/process', [EtlController, 'processData']);
    router.post('/ews/update', [EarlyWarningSystemsController, 'update']);
    router.post('/ews/webhook', [EarlyWarningSystemsController, 'webhook']);
}).prefix("/api");

// <-- INSTRUCTOR AND STUDENT API ROUTES -->
router.group(() => {
    router.get('/auth/session', [AuthController, 'sessionInfo'])

    router.get('/analytics/activity-accessed/:course_id/:student_id', [AnalyticsController, 'getStudentActivityAccessed'])
    router.get('/analytics/performance-per-assignment/:course_id/:student_id', [AnalyticsController, 'getStudentPerformancePerAssignment'])
    router.get('/analytics/student-quick-metrics/:course_id/:student_id', [AnalyticsController, 'getStudentQuickMetrics'])

    router.get('/courses/:id', [CoursesController, 'getCourse'])
    router.get('/courses/:id/has-data', [CoursesController, 'getHasData'])
    router.get('/courses/:id/assignments', [CoursesController, 'getCourseAssignments'])
    router.get('/courses/:id/analytics-settings', [CoursesController, 'getCourseAnalyticsSettings'])
}).prefix("/api").use(middleware.auth())

// <-- INSTRUCTOR ONLY API ROUTES -->
router.group(() => {
    router.get('/analytics/grade-distribution/:course_id', [AnalyticsController, 'getGradeDistribution'])
    router.get('/analytics/learning-objective-completion/:course_id', [AnalyticsController, 'getLearningObjectiveCompletion'])
    router.get('/analytics/learning-curves/:course_id', [AnalyticsController, 'getLearningCurves'])

    router.get('/analytics/instructor-quick-metrics/:course_id', [AnalyticsController, 'getInstructorQuickMetrics'])

    router.get('/analytics/adapt-performance/:course_id/:assignment_id', [AnalyticsController, 'getADAPTPerformance'])
    router.get('/analytics/submission-timeline/:course_id/:assignment_id', [AnalyticsController, 'getSubmissionTimeline'])

    router.get('/analytics/time-on-task/:course_id/:assignment_id/:student_id', [AnalyticsController, 'getTimeOnTask'])
    router.get('/analytics/time-in-review/:course_id/:assignment_id/:student_id', [AnalyticsController, 'getTimeInReview'])

    router.get('/courses/:id/framework-data', [CoursesController, 'getCourseFrameworkData'])
    router.put('/courses/:id/analytics-settings', [CoursesController, 'updateCourseAnalyticsSettings'])
    router.get('/courses/:id/raw-data', [CoursesController, 'getCourseRawData'])
    router.get('/courses/:id/students', [CoursesController, 'getStudents'])

    router.get('/early-warning/:course_id/results', [EarlyWarningSystemsController, 'results'])

}).prefix("/api").use(middleware.instructor_auth())