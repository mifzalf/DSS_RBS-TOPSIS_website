import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { useFeedback } from '../../app/providers/useFeedback'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { DataTable } from '../../components/data-display/DataTable'
import { DecisionModelPageNav } from '../../components/navigation/DecisionModelPageNav'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { FormField } from '../../components/form/FormField'
import { SelectField } from '../../components/form/SelectField'
import { TextField } from '../../components/form/TextField'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'
import { queryKeys } from '../../constants/queryKeys'
import { RULE_ACTION_OPTIONS, RULE_VARIABLE_TYPE_OPTIONS } from '../../constants/routes'
import { useRuleVariables } from '../../features/rule-variable/useRuleVariables'
import { useRulesWithConditions } from '../../features/rule/useRules'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'
import { ruleApi } from '../../services/api/rule.api'

const conditionSchema = z.object({
  rule_variable_id: z.string().min(1, 'Rule variable is required.'),
  operator: z.enum(['=', '>', '<', '>=', '<=']),
  value: z.string().min(1, 'Value is required.'),
})

export function RulesPage() {
  const decisionModelId = useDecisionModelId()
  const queryClient = useQueryClient()
  const { pushToast } = useFeedback()
  const [conditionModal, setConditionModal] = useState({ open: false, rule: null })
  const { data = [], isLoading, error, refetch } = useRulesWithConditions(decisionModelId)
  const { data: ruleVariables = [] } = useRuleVariables(decisionModelId)
  const conditionMutation = useMutation({
    mutationFn: ruleApi.createCondition,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.rules(decisionModelId) }),
  })
  const { control, register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(conditionSchema),
    defaultValues: { rule_variable_id: '', operator: '=', value: '' },
  })
  const selectedRuleVariableId = useWatch({ control, name: 'rule_variable_id' })

  if (isLoading) {
    return <LoadingState title="Loading rules" description="Preparing priority, logic type, and nested conditions." />
  }

  if (error) {
    return <ErrorState description={error.message} onAction={refetch} />
  }

  const selectedVariable = ruleVariables.find((item) => String(item.id) === selectedRuleVariableId)

  const onSubmitCondition = handleSubmit(async (values) => {
    try {
      await conditionMutation.mutateAsync({
        rule_id: conditionModal.rule.id,
        rule_variable_id: Number(values.rule_variable_id),
        operator: values.operator,
        value: values.value,
      })
      pushToast({ title: 'Rule condition added', description: 'The rule now references the selected typed variable.', tone: 'success' })
      setConditionModal({ open: false, rule: null })
      reset({ rule_variable_id: '', operator: '=', value: '' })
    } catch (submitError) {
      pushToast({ title: 'Failed to add condition', description: submitError.message, tone: 'error' })
    }
  })

  return (
    <div className="page-stack">
      <DecisionModelPageNav currentLabel="Rules" />
      <PageHeader eyebrow="Rules" title="Expose rule priority and AND/OR logic before recommendation is generated." description="Conditions now target typed rule variables, while actions align with grouped recommendation output." />
      <SectionCard title="Rule list" description="Condition count stays visible to help users compare simple and complex rules.">
        <div className="rule-card-list">
          {data.map((rule) => (
            <article key={rule.id} className="rule-card">
              <div className="rule-card-head">
                <div>
                  <strong>{rule.name || `Rule ${rule.priority}`}</strong>
                  <p>Priority {rule.priority} · {rule.logic_type}</p>
                </div>
                <div className="rule-card-badges">
                  <Badge tone={rule.action_type === 'reject' ? 'warning' : 'success'}>{rule.action_type}</Badge>
                  <Badge tone={rule.status_active ? 'success' : 'neutral'}>{rule.status_active ? 'active' : 'inactive'}</Badge>
                </div>
              </div>
              <div className="rule-card-target"><span>Target category</span><strong>{rule.target_category || 'Not eligible'}</strong></div>
              <div className="rule-card-meta-row">
                <Badge tone={rule.action_type === 'reject' ? 'warning' : 'success'}>{RULE_ACTION_OPTIONS.find((item) => item.value === rule.action_type)?.label || rule.action_type}</Badge>
                <Button type="button" variant="ghost" onClick={() => {
                  reset({ rule_variable_id: '', operator: '=', value: '' })
                  setConditionModal({ open: true, rule })
                }}>
                  Add condition
                </Button>
              </div>
              <div className="rule-condition-list">
                {rule.conditions.length ? (
                  rule.conditions.map((condition) => (
                    <div key={condition.id} className="rule-condition-item">
                      <strong>{condition.ruleVariable ? `${condition.ruleVariable.code} · ${condition.ruleVariable.name}` : condition.field}</strong>
                      <span>{condition.operator} {condition.value}</span>
                    </div>
                  ))
                ) : (
                  <p>No conditions attached yet.</p>
                )}
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <Modal
        open={conditionModal.open}
        title={conditionModal.rule ? `Add condition to ${conditionModal.rule.name || `Rule ${conditionModal.rule.priority}`}` : 'Add condition'}
        onClose={() => setConditionModal({ open: false, rule: null })}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setConditionModal({ open: false, rule: null })}>Cancel</Button>
            <Button type="submit" form="rule-condition-form" disabled={isSubmitting || conditionMutation.isPending}>Save condition</Button>
          </>
        }
      >
        <form id="rule-condition-form" className="stack-md" onSubmit={onSubmitCondition}>
          <FormField label="Rule variable" error={errors.rule_variable_id?.message}>
            <SelectField
              options={[{ value: '', label: 'Select variable' }, ...ruleVariables.map((item) => ({ value: String(item.id), label: `${item.code} - ${item.name}` }))]}
              {...register('rule_variable_id')}
            />
          </FormField>
          {selectedVariable ? (
            <div className="rule-variable-help mini-card">
              <strong>{selectedVariable.code} - {selectedVariable.name}</strong>
              <p>Value type: {RULE_VARIABLE_TYPE_OPTIONS.find((item) => item.value === selectedVariable.value_type)?.label || selectedVariable.value_type}</p>
            </div>
          ) : null}
          <FormField label="Operator" error={errors.operator?.message}>
            <SelectField options={[{ value: '=', label: '=' }, { value: '>', label: '>' }, { value: '<', label: '<' }, { value: '>=', label: '>=' }, { value: '<=', label: '<=' }]} {...register('operator')} />
          </FormField>
          <FormField label="Value" error={errors.value?.message}>
            <TextField {...register('value')} placeholder={selectedVariable?.value_type === 'boolean' ? 'true / false' : selectedVariable?.value_type === 'number' ? 'Enter numeric value' : 'Enter string value'} />
          </FormField>
        </form>
      </Modal>
    </div>
  )
}
