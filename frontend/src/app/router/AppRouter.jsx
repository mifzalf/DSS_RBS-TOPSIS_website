import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout'
import { AuthLayout } from '../layouts/AuthLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicOnlyRoute } from './PublicOnlyRoute'
import { LoginPage } from '../../pages/auth/LoginPage'
import { RegisterPage } from '../../pages/auth/RegisterPage'
import { DashboardPage } from '../../pages/dashboard/DashboardPage'
import { DecisionModelListPage } from '../../pages/decision-model/DecisionModelListPage'
import { DecisionModelDetailPage } from '../../pages/decision-model/DecisionModelDetailPage'
import { MembersPage } from '../../pages/decision-model/MembersPage'
import { CriteriaPage } from '../../pages/criteria/CriteriaPage'
import { AlternativesPage } from '../../pages/alternative/AlternativesPage'
import { EvaluationsPage } from '../../pages/evaluation/EvaluationsPage'
import { RulesPage } from '../../pages/rule/RulesPage'
import { ResultsPage } from '../../pages/result/ResultsPage'
import { RecommendationPage } from '../../pages/recommendation/RecommendationPage'
import { NotFoundPage } from '../../pages/NotFoundPage'
import { ROUTES } from '../../constants/routes'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.register} element={<RegisterPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path={ROUTES.dashboard} element={<DashboardPage />} />
          <Route path={ROUTES.decisionModels} element={<DecisionModelListPage />} />
          <Route path={`${ROUTES.decisionModels}/:id`} element={<DecisionModelDetailPage />} />
          <Route path={`${ROUTES.decisionModels}/:id/members`} element={<MembersPage />} />
          <Route path={`${ROUTES.decisionModels}/:id/criteria`} element={<CriteriaPage />} />
          <Route path={`${ROUTES.decisionModels}/:id/alternatives`} element={<AlternativesPage />} />
          <Route path={`${ROUTES.decisionModels}/:id/evaluations`} element={<EvaluationsPage />} />
          <Route path={`${ROUTES.decisionModels}/:id/rules`} element={<RulesPage />} />
          <Route path={`${ROUTES.decisionModels}/:id/results`} element={<ResultsPage />} />
          <Route path={`${ROUTES.decisionModels}/:id/recommendation`} element={<RecommendationPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to={ROUTES.dashboard} replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
