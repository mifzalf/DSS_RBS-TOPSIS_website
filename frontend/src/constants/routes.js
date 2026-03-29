export const ROUTES = {
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  decisionModels: '/decision-models',
}

export const WORKFLOW_STEPS = [
  { key: 'model', label: 'Create model', description: 'Define the decision context and ownership.' },
  { key: 'criteria', label: 'Define criteria', description: 'Set weighted benefit and cost criteria.' },
  { key: 'alternatives', label: 'Add alternatives', description: 'List the options that will be evaluated.' },
  { key: 'evaluations', label: 'Fill TOPSIS evaluations', description: 'Complete the matrix with relevant sub-criteria.' },
  { key: 'rule-variables', label: 'Define rule variables', description: 'Declare typed RBS facts used by rule conditions.' },
  { key: 'rule-evaluations', label: 'Fill rule evaluations', description: 'Assign typed fact values per alternative.' },
  { key: 'rules', label: 'Configure rules', description: 'Add business logic, actions, and prioritization rules.' },
  { key: 'recommendation', label: 'Generate recommendation', description: 'Review final ranking and share it.' },
]

export const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
]

export const CRITERIA_TYPE_OPTIONS = [
  { value: 'benefit', label: 'Benefit' },
  { value: 'cost', label: 'Cost' },
]

export const RULE_VARIABLE_TYPE_OPTIONS = [
  { value: 'boolean', label: 'Boolean' },
  { value: 'number', label: 'Number' },
  { value: 'string', label: 'String' },
]

export const RULE_ACTION_OPTIONS = [
  { value: 'assign_benefit', label: 'Assign benefit' },
  { value: 'reject', label: 'Reject' },
]
