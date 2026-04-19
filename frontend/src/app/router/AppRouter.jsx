import { Navigate, Route, Routes } from 'react-router-dom'
import { RootLayout } from '../layouts/RootLayout'
import { DecisionModelWorkspaceLayout } from '../layouts/DecisionModelWorkspaceLayout'
import { AuthLayout } from '../layouts/AuthLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicOnlyRoute } from './PublicOnlyRoute'
import { LoginPage } from '../../pages/auth/LoginPage'
import { RegisterPage } from '../../pages/auth/RegisterPage'
import { DecisionModelListPage } from '../../pages/decision-model/DecisionModelListPage'
import { DecisionModelDetailPage } from '../../pages/decision-model/DecisionModelDetailPage'
import { MembersPage } from '../../pages/general/MembersPage'
import { AssistanceCategoriesPage } from '../../pages/general/AssistanceCategoriesPage'
import { GradePoliciesPage } from '../../pages/general/GradePoliciesPage'
import { RecommendationPage } from '../../pages/general/RecommendationPage'
import { CriteriaPage } from '../../pages/topsis/CriteriaPage'
import { EvaluationsPage } from '../../pages/topsis/EvaluationsPage'
import { AlternativesPage } from '../../pages/alternatives/AlternativesPage'
import { RuleEvaluationsPage } from '../../pages/alternatives/RuleEvaluationsPage'
import { RulesPage } from '../../pages/rule-base/RulesPage'
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
        <Route element={<RootLayout />}>
          <Route path={ROUTES.decisionModels} element={<DecisionModelListPage />} />
        </Route>

        <Route element={<DecisionModelWorkspaceLayout />}>
          <Route path={`${ROUTES.decisionModels}/:id`} element={<DecisionModelDetailPage />} />
          <Route path={`${ROUTES.decisionModels}/:id/members`} element={<MembersPage />} />
          <Route path={`${ROUTES.decisionModels}/:id/criteria`} element={<CriteriaPage />} />
          <Route path={`${ROUTES.decisionModels}/:id/assistance-categories`} element={<AssistanceCategoriesPage />} />
          <Route path={`${ROUTES.decisionModels}/:id/alternatives`} element={<AlternativesPage />} />
          <Route path={`${ROUTES.decisionModels}/:id/evaluations`} element={<EvaluationsPage />} />
          <Route path={`${ROUTES.decisionModels}/:id/rule-evaluations`} element={<RuleEvaluationsPage />} />
          <Route path={`${ROUTES.decisionModels}/:id/rules`} element={<RulesPage />} />
          <Route path={`${ROUTES.decisionModels}/:id/grade-policies`} element={<GradePoliciesPage />} />
          <Route path={`${ROUTES.decisionModels}/:id/recommendation`} element={<RecommendationPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to={ROUTES.decisionModels} replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
