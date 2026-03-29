export const ROUTES = {
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  decisionModels: '/decision-models',
}

export const WORKFLOW_STEPS = [
  { key: 'model', label: 'Set the program', description: 'Name the assistance program and prepare the review space.' },
  { key: 'criteria', label: 'Set the assessment factors', description: 'Arrange the factors and their importance levels.' },
  { key: 'alternatives', label: 'Add households', description: 'List the households or candidates to be reviewed.' },
  { key: 'evaluations', label: 'Fill assessment answers', description: 'Choose the most suitable answer for each factor.' },
  { key: 'rule-variables', label: 'Set eligibility indicators', description: 'Prepare the indicators used to determine assistance eligibility.' },
  { key: 'rule-evaluations', label: 'Fill eligibility answers', description: 'Record the factual answers for each household.' },
  { key: 'rules', label: 'Set assistance rules', description: 'Define how households are grouped into assistance categories.' },
  { key: 'recommendation', label: 'See final recommendations', description: 'Review grouped outcomes and priority order for each category.' },
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
