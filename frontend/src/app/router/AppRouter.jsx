import { Navigate, Route, Routes, useParams } from 'react-router-dom'
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
import { CriteriaPage } from '../../pages/topsis/CriteriaPage'
import { RulesPage } from '../../pages/rule-base/RulesPage'
import { RecommendationAlternativesPage } from '../../pages/recommendation-flow/RecommendationAlternativesPage'
import { RecommendationEvaluationsPage } from '../../pages/recommendation-flow/RecommendationEvaluationsPage'
import { RecommendationResultsPage } from '../../pages/recommendation-flow/RecommendationResultsPage'
import { NotFoundPage } from '../../pages/NotFoundPage'
import { ROUTES } from '../../constants/routes'

function RecommendationRedirect() {
  const { id } = useParams()
  return <Navigate to={`/decision-models/${id}/recommendation/alternatives`} replace />
}

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
          <Route path={`${ROUTES.decisionModels}/:id/rules`} element={<RulesPage />} />
          <Route path={`${ROUTES.decisionModels}/:id/grade-policies`} element={<GradePoliciesPage />} />

          <Route path={`${ROUTES.decisionModels}/:id/recommendation`} element={<RecommendationRedirect />} />
          <Route path={`${ROUTES.decisionModels}/:id/recommendation/alternatives`} element={<RecommendationAlternativesPage />} />
          <Route path={`${ROUTES.decisionModels}/:id/recommendation/evaluations`} element={<RecommendationEvaluationsPage />} />
          <Route path={`${ROUTES.decisionModels}/:id/recommendation/results`} element={<RecommendationResultsPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to={ROUTES.decisionModels} replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
