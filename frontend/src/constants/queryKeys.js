export const queryKeys = {
  auth: ['auth'],
  decisionModels: ['decision-models'],
  decisionModel: (id) => ['decision-models', id],
  members: (decisionModelId) => ['decision-models', decisionModelId, 'members'],
  criteria: (decisionModelId) => ['criteria', decisionModelId],
  alternatives: (decisionModelId) => ['alternatives', decisionModelId],
  evaluations: (alternativeId) => ['evaluations', alternativeId],
  rules: (decisionModelId) => ['rules', decisionModelId],
  ruleConditions: (ruleId) => ['rules', ruleId, 'conditions'],
  results: (decisionModelId) => ['results', decisionModelId],
}
