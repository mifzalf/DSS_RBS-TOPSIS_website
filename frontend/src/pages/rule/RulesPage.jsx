import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { useFeedback } from '../../app/providers/useFeedback'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { DecisionModelPageNav } from '../../components/navigation/DecisionModelPageNav'
import { Badge } from '../../components/ui/Badge'
import { ActionMenu } from '../../components/ui/ActionMenu'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { FormField } from '../../components/form/FormField'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'
import { SelectField } from '../../components/form/SelectField'
import { TextField } from '../../components/form/TextField'
import { queryKeys } from '../../constants/queryKeys'
import { RULE_ACTION_OPTIONS, RULE_VARIABLE_TYPE_OPTIONS } from '../../constants/routes'
import { useRuleVariables } from '../../features/rule-variable/useRuleVariables'
import { useRulesWithConditions } from '../../features/rule/useRules'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'
import { ruleApi } from '../../services/api/rule.api'

const ruleSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(150, 'Maximum 150 characters.'),
  priority: z.coerce.number().int().min(1, 'Minimum priority is 1.'),
  logic_type: z.enum(['AND', 'OR']),
  action_type: z.enum(['assign_benefit', 'reject']),
  target_category: z.string().min(1, 'Target category is required.').max(100, 'Maximum 100 characters.'),
  status_active: z.enum(['true', 'false']),
})

const conditionSchema = z.object({
  rule_variable_id: z.string().min(1, 'Rule variable is required.'),
  operator: z.enum(['=', '>', '<', '>=', '<=']),
  value: z.string().min(1, 'Value is required.'),
})

export function RulesPage() {
  const decisionModelId = useDecisionModelId()
  const queryClient = useQueryClient()
  const { pushToast } = useFeedback()
  const [ruleModal, setRuleModal] = useState({ open: false, rule: null })
  const [conditionModal, setConditionModal] = useState({ open: false, rule: null, condition: null })
  const [deleteState, setDeleteState] = useState({ type: null, item: null })
  const { data = [], isLoading, error, refetch } = useRulesWithConditions(decisionModelId)
  const { data: ruleVariables = [] } = useRuleVariables(decisionModelId)
  const ruleMutation = useMutation({
    mutationFn: ({ id, payload }) => (id ? ruleApi.update(id, payload) : ruleApi.create(payload)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.rules(decisionModelId) }),
  })
  const conditionMutation = useMutation({
    mutationFn: ({ id, payload }) => (id ? ruleApi.updateCondition(id, payload) : ruleApi.createCondition(payload)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.rules(decisionModelId) }),
  })
  const deleteRuleMutation = useMutation({
    mutationFn: ruleApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.rules(decisionModelId) }),
  })
  const deleteConditionMutation = useMutation({
    mutationFn: ruleApi.removeCondition,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.rules(decisionModelId) }),
  })
  const ruleForm = useForm({
    resolver: zodResolver(ruleSchema),
    defaultValues: { name: '', priority: 1, logic_type: 'AND', action_type: 'assign_benefit', target_category: '', status_active: 'true' },
  })
  const conditionForm = useForm({
    resolver: zodResolver(conditionSchema),
    defaultValues: { rule_variable_id: '', operator: '=', value: '' },
  })
  const selectedRuleVariableId = useWatch({ control: conditionForm.control, name: 'rule_variable_id' })

  if (isLoading) return <LoadingState title="Loading rules" description="Preparing priority, logic type, and nested conditions." />
  if (error) return <ErrorState description={error.message} onAction={refetch} />

  const selectedVariable = ruleVariables.find((item) => String(item.id) === selectedRuleVariableId)

  const openCreateRule = () => {
    ruleForm.reset({ name: '', priority: data.length + 1, logic_type: 'AND', action_type: 'assign_benefit', target_category: '', status_active: 'true' })
    setRuleModal({ open: true, rule: null })
  }

  const openEditRule = (rule) => {
    ruleForm.reset({ name: rule.name || '', priority: rule.priority, logic_type: rule.logic_type, action_type: rule.action_type, target_category: rule.target_category || '', status_active: String(Boolean(rule.status_active)) })
    setRuleModal({ open: true, rule })
  }

  const openCreateCondition = (rule) => {
    conditionForm.reset({ rule_variable_id: '', operator: '=', value: '' })
    setConditionModal({ open: true, rule, condition: null })
  }

  const openEditCondition = (rule, condition) => {
    conditionForm.reset({ rule_variable_id: String(condition.rule_variable_id || ''), operator: condition.operator, value: condition.value })
    setConditionModal({ open: true, rule, condition })
  }

  const submitRule = ruleForm.handleSubmit(async (values) => {
    const payload = {
      decision_model_id: Number(decisionModelId),
      name: values.name,
      priority: Number(values.priority),
      logic_type: values.logic_type,
      action_type: values.action_type,
      target_category: values.target_category,
      status_active: values.status_active === 'true',
    }

    try {
      await ruleMutation.mutateAsync({ id: ruleModal.rule?.id, payload })
      pushToast({ title: ruleModal.rule ? 'Rule updated' : 'Rule created', description: 'Rule configuration has been saved.', tone: 'success' })
      setRuleModal({ open: false, rule: null })
    } catch (submitError) {
      pushToast({ title: 'Rule request failed', description: submitError.message, tone: 'error' })
    }
  })

  const submitCondition = conditionForm.handleSubmit(async (values) => {
    try {
      await conditionMutation.mutateAsync({
        id: conditionModal.condition?.id,
        payload: {
          rule_id: conditionModal.rule.id,
          rule_variable_id: Number(values.rule_variable_id),
          operator: values.operator,
          value: values.value,
        },
      })
      pushToast({ title: conditionModal.condition ? 'Condition updated' : 'Condition added', description: 'Rule condition has been saved.', tone: 'success' })
      setConditionModal({ open: false, rule: null, condition: null })
    } catch (submitError) {
      pushToast({ title: 'Condition request failed', description: submitError.message, tone: 'error' })
    }
  })

  const handleDelete = async () => {
    try {
      if (deleteState.type === 'rule') {
        await deleteRuleMutation.mutateAsync(deleteState.item.id)
        pushToast({ title: 'Rule deleted', description: 'Rule configuration has been removed.', tone: 'success' })
      }
      if (deleteState.type === 'condition') {
        await deleteConditionMutation.mutateAsync(deleteState.item.id)
        pushToast({ title: 'Condition deleted', description: 'Rule condition has been removed.', tone: 'success' })
      }
      setDeleteState({ type: null, item: null })
    } catch (deleteError) {
      pushToast({ title: 'Delete request failed', description: deleteError.message, tone: 'error' })
    }
  }

  return (
    <div className="page-stack">
      <DecisionModelPageNav currentLabel="Rules" />
      <PageHeader eyebrow="Rules" title="Expose rule priority and AND/OR logic before recommendation is generated." description="Create rules, attach typed conditions, and control the final assign_benefit or reject actions." actions={<Button type="button" onClick={openCreateRule}>Add rule</Button>} />
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
                <ActionMenu items={[{ label: 'Add condition', onSelect: () => openCreateCondition(rule) }, { label: 'Edit rule', onSelect: () => openEditRule(rule) }, { label: 'Delete rule', tone: 'danger', onSelect: () => setDeleteState({ type: 'rule', item: rule }) }]} />
              </div>
              <div className="rule-condition-list">
                {rule.conditions.length ? rule.conditions.map((condition) => (
                  <div key={condition.id} className="rule-condition-item">
                    <div>
                      <strong>{condition.ruleVariable ? `${condition.ruleVariable.code} · ${condition.ruleVariable.name}` : condition.field}</strong>
                      <span>{condition.operator} {condition.value}</span>
                    </div>
                    <ActionMenu items={[{ label: 'Edit condition', onSelect: () => openEditCondition(rule, condition) }, { label: 'Delete condition', tone: 'danger', onSelect: () => setDeleteState({ type: 'condition', item: condition }) }]} />
                  </div>
                )) : <p>No conditions attached yet.</p>}
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <Modal open={ruleModal.open} title={ruleModal.rule ? 'Edit rule' : 'Create rule'} onClose={() => setRuleModal({ open: false, rule: null })} footer={<><Button type="button" variant="ghost" onClick={() => setRuleModal({ open: false, rule: null })}>Cancel</Button><Button type="submit" form="rule-form" disabled={ruleForm.formState.isSubmitting || ruleMutation.isPending}>Save rule</Button></>}>
        <form id="rule-form" className="stack-md" onSubmit={submitRule}>
          <FormField label="Name" error={ruleForm.formState.errors.name?.message}><TextField {...ruleForm.register('name')} placeholder="Eligibility rule 1" /></FormField>
          <FormField label="Priority" error={ruleForm.formState.errors.priority?.message}><TextField type="number" {...ruleForm.register('priority')} /></FormField>
          <FormField label="Logic type" error={ruleForm.formState.errors.logic_type?.message}><SelectField options={[{ value: 'AND', label: 'AND' }, { value: 'OR', label: 'OR' }]} {...ruleForm.register('logic_type')} /></FormField>
          <FormField label="Action" error={ruleForm.formState.errors.action_type?.message}><SelectField options={RULE_ACTION_OPTIONS} {...ruleForm.register('action_type')} /></FormField>
          <FormField label="Target category" error={ruleForm.formState.errors.target_category?.message}><TextField {...ruleForm.register('target_category')} placeholder="PKH" /></FormField>
          <FormField label="Status" error={ruleForm.formState.errors.status_active?.message}><SelectField options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]} {...ruleForm.register('status_active')} /></FormField>
        </form>
      </Modal>

      <Modal open={conditionModal.open} title={conditionModal.rule ? `${conditionModal.condition ? 'Edit' : 'Add'} condition for ${conditionModal.rule.name || `Rule ${conditionModal.rule.priority}`}` : 'Condition'} onClose={() => setConditionModal({ open: false, rule: null, condition: null })} footer={<><Button type="button" variant="ghost" onClick={() => setConditionModal({ open: false, rule: null, condition: null })}>Cancel</Button><Button type="submit" form="rule-condition-form" disabled={conditionForm.formState.isSubmitting || conditionMutation.isPending}>Save condition</Button></>}>
        <form id="rule-condition-form" className="stack-md" onSubmit={submitCondition}>
          <FormField label="Rule variable" error={conditionForm.formState.errors.rule_variable_id?.message}><SelectField options={[{ value: '', label: 'Select variable' }, ...ruleVariables.map((item) => ({ value: String(item.id), label: `${item.code} - ${item.name}` }))]} {...conditionForm.register('rule_variable_id')} /></FormField>
          {selectedVariable ? <div className="rule-variable-help mini-card"><strong>{selectedVariable.code} - {selectedVariable.name}</strong><p>Value type: {RULE_VARIABLE_TYPE_OPTIONS.find((item) => item.value === selectedVariable.value_type)?.label || selectedVariable.value_type}</p></div> : null}
          <FormField label="Operator" error={conditionForm.formState.errors.operator?.message}><SelectField options={[{ value: '=', label: '=' }, { value: '>', label: '>' }, { value: '<', label: '<' }, { value: '>=', label: '>=' }, { value: '<=', label: '<=' }]} {...conditionForm.register('operator')} /></FormField>
          <FormField label="Value" error={conditionForm.formState.errors.value?.message}><TextField {...conditionForm.register('value')} placeholder={selectedVariable?.value_type === 'boolean' ? 'true / false' : selectedVariable?.value_type === 'number' ? 'Enter numeric value' : 'Enter string value'} /></FormField>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(deleteState.item)} title={`Delete ${deleteState.type || 'item'}`} description={`Delete ${deleteState.type === 'rule' ? deleteState.item?.name : 'this condition'}?`} confirmLabel={(deleteState.type === 'rule' ? deleteRuleMutation.isPending : deleteConditionMutation.isPending) ? 'Deleting...' : 'Delete'} onClose={() => setDeleteState({ type: null, item: null })} onConfirm={handleDelete} />
    </div>
  )
}
