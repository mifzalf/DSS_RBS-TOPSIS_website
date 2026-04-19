import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { useFeedback } from '../../app/providers/useFeedback'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { Badge } from '../../components/ui/Badge'
import { ActionMenu } from '../../components/ui/ActionMenu'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { DropdownSelect } from '../../components/ui/DropdownSelect'
import { FormField } from '../../components/form/FormField'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'
import { TextField } from '../../components/form/TextField'
import { queryKeys } from '../../constants/queryKeys'
import { RULE_ACTION_OPTIONS, RULE_VARIABLE_TYPE_OPTIONS } from '../../constants/options'
import { useAssistanceCategories } from '../../features/assistance-categories/useAssistanceCategories'
import { useCreateRuleVariable, useDeleteRuleVariable, useRuleVariables, useUpdateRuleVariable } from '../../features/rule-variable/useRuleVariables'
import { useRulesWithConditions } from '../../features/rule/useRules'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'
import { ruleApi } from '../../services/api/rule.api'

const variableSchema = z.object({
  code: z.string().min(1, 'Code is required.').max(30, 'Maximum 30 characters.'),
  name: z.string().min(1, 'Name is required.').max(150, 'Maximum 150 characters.'),
  value_type: z.enum(['boolean', 'number', 'string']),
  description: z.string().max(5000, 'Maximum 5000 characters.').optional().or(z.literal('')),
  status_active: z.enum(['true', 'false']),
})

const ruleSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(150, 'Maximum 150 characters.'),
  priority: z.coerce.number().int().min(1, 'Minimum priority is 1.'),
  logic_type: z.enum(['AND', 'OR']),
  action_type: z.enum(['assign_benefit', 'reject']),
  category_id: z.string().min(1, 'Category is required.'),
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
  const [variableModal, setVariableModal] = useState({ open: false, variable: null })
  const [ruleModal, setRuleModal] = useState({ open: false, rule: null })
  const [conditionModal, setConditionModal] = useState({ open: false, rule: null, condition: null })
  const [deleteState, setDeleteState] = useState({ type: null, item: null })
  const { data = [], isLoading, error, refetch } = useRulesWithConditions(decisionModelId)
  const { data: categories = [] } = useAssistanceCategories(decisionModelId)
  const { data: ruleVariables = [] } = useRuleVariables(decisionModelId)
  const createVariableMutation = useCreateRuleVariable(decisionModelId)
  const updateVariableMutation = useUpdateRuleVariable(decisionModelId)
  const deleteVariableMutation = useDeleteRuleVariable(decisionModelId)
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

  const variableForm = useForm({
    resolver: zodResolver(variableSchema),
    defaultValues: { code: '', name: '', value_type: 'boolean', description: '', status_active: 'true' },
  })
  const ruleForm = useForm({
    resolver: zodResolver(ruleSchema),
    defaultValues: { name: '', priority: 1, logic_type: 'AND', action_type: 'assign_benefit', category_id: '', status_active: 'true' },
  })
  const conditionForm = useForm({
    resolver: zodResolver(conditionSchema),
    defaultValues: { rule_variable_id: '', operator: '=', value: '' },
  })

  const variableTypeValue = useWatch({ control: variableForm.control, name: 'value_type' })
  const variableStatusValue = useWatch({ control: variableForm.control, name: 'status_active' })
  const ruleLogicTypeValue = useWatch({ control: ruleForm.control, name: 'logic_type' })
  const ruleActionTypeValue = useWatch({ control: ruleForm.control, name: 'action_type' })
  const ruleCategoryValue = useWatch({ control: ruleForm.control, name: 'category_id' })
  const ruleStatusValue = useWatch({ control: ruleForm.control, name: 'status_active' })
  const selectedRuleVariableId = useWatch({ control: conditionForm.control, name: 'rule_variable_id' })
  const selectedActionType = useWatch({ control: ruleForm.control, name: 'action_type' })
  const conditionOperatorValue = useWatch({ control: conditionForm.control, name: 'operator' })

  if (isLoading) return <LoadingState title="Loading rule base" description="Preparing rule variables, rules, and nested conditions." />
  if (error) return <ErrorState description={error.message} onAction={refetch} />

  const selectedVariable = ruleVariables.find((item) => String(item.id) === selectedRuleVariableId)
  const filteredCategories = categories.filter((category) => {
    if (selectedActionType === 'assign_benefit') return category.is_ranked
    if (selectedActionType === 'reject') return !category.is_ranked
    return true
  })

  const openCreateVariable = () => {
    variableForm.reset({ code: '', name: '', value_type: 'boolean', description: '', status_active: 'true' })
    setVariableModal({ open: true, variable: null })
  }

  const openEditVariable = (variable) => {
    variableForm.reset({ code: variable.code, name: variable.name, value_type: variable.value_type, description: variable.description || '', status_active: String(Boolean(variable.status_active)) })
    setVariableModal({ open: true, variable })
  }

  const openCreateRule = () => {
    ruleForm.reset({ name: '', priority: data.length + 1, logic_type: 'AND', action_type: 'assign_benefit', category_id: '', status_active: 'true' })
    setRuleModal({ open: true, rule: null })
  }

  const openEditRule = (rule) => {
    ruleForm.reset({ name: rule.name || '', priority: rule.priority, logic_type: rule.logic_type, action_type: rule.action_type, category_id: String(rule.category_id || ''), status_active: String(Boolean(rule.status_active)) })
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

  const submitVariable = variableForm.handleSubmit(async (values) => {
    const payload = {
      ...values,
      decision_model_id: Number(decisionModelId),
      status_active: values.status_active === 'true',
    }

    try {
      if (variableModal.variable) {
        await updateVariableMutation.mutateAsync({ id: variableModal.variable.id, payload })
        pushToast({ title: 'Rule variable updated', description: 'Typed fact definition has been refreshed.', tone: 'success' })
      } else {
        await createVariableMutation.mutateAsync(payload)
        pushToast({ title: 'Rule variable created', description: 'New typed fact can now be used in rule conditions.', tone: 'success' })
      }
      setVariableModal({ open: false, variable: null })
    } catch (submitError) {
      pushToast({ title: 'Rule variable request failed', description: submitError.message, tone: 'error' })
    }
  })

  const submitRule = ruleForm.handleSubmit(async (values) => {
    const payload = {
      decision_model_id: Number(decisionModelId),
      name: values.name,
      priority: Number(values.priority),
      logic_type: values.logic_type,
      action_type: values.action_type,
      category_id: Number(values.category_id),
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
      if (deleteState.type === 'variable') {
        await deleteVariableMutation.mutateAsync(deleteState.item.id)
        pushToast({ title: 'Rule variable deleted', description: 'Typed fact definition has been removed.', tone: 'success' })
      }
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
      <PageHeader
        eyebrow="Rule Base"
        title="Define facts and rules in one workspace so the rule engine stays compact and readable."
        description="Rule variables act like reusable fact definitions, while rules and conditions turn those facts into category assignments."
      />

      <div className="content-grid two-column">
        <SectionCard title="Rule variables" description="Typed facts used by rule conditions and alternative-level rule evaluations." actions={<Button type="button" onClick={openCreateVariable}>Add variable</Button>}>
          <div className="rule-card-list">
            {ruleVariables.length ? ruleVariables.map((variable) => (
              <article key={variable.id} className="rule-card">
                <div className="rule-card-head">
                  <div>
                    <strong>{variable.code} - {variable.name}</strong>
                    <p>{variable.description || 'No description provided.'}</p>
                  </div>
                  <div className="rule-card-badges">
                    <Badge tone="info">{variable.value_type}</Badge>
                    <Badge tone={variable.status_active ? 'success' : 'neutral'}>{variable.status_active ? 'active' : 'inactive'}</Badge>
                  </div>
                </div>
                <div className="rule-card-meta-row">
                  <Badge tone="info">Typed fact</Badge>
                  <ActionMenu items={[{ label: 'Edit variable', onSelect: () => openEditVariable(variable) }, { label: 'Delete variable', tone: 'danger', onSelect: () => setDeleteState({ type: 'variable', item: variable }) }]} />
                </div>
              </article>
            )) : <p className="subtle-text">No rule variables yet.</p>}</div>
        </SectionCard>

        <SectionCard title="Rules" description="Use variables and categories to assign benefits or reject households." actions={<Button type="button" onClick={openCreateRule}>Add rule</Button>}>
          <div className="rule-card-list">
            {data.length ? data.map((rule) => (
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
                <div className="rule-card-target"><span>Target category</span><strong>{rule.categoryRef?.name || `Category #${rule.category_id}`}</strong></div>
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
            )) : <p className="subtle-text">No rules yet.</p>}
          </div>
        </SectionCard>
      </div>

      <Modal open={variableModal.open} title={variableModal.variable ? 'Edit rule variable' : 'Create rule variable'} onClose={() => setVariableModal({ open: false, variable: null })} footer={<><Button type="button" variant="ghost" onClick={() => setVariableModal({ open: false, variable: null })}>Cancel</Button><Button type="submit" form="rule-variable-form" disabled={variableForm.formState.isSubmitting || createVariableMutation.isPending || updateVariableMutation.isPending}>Save variable</Button></>}>
        <form id="rule-variable-form" className="stack-md" onSubmit={submitVariable}>
          <FormField label="Code" error={variableForm.formState.errors.code?.message}><TextField {...variableForm.register('code')} placeholder="V1" /></FormField>
          <FormField label="Name" error={variableForm.formState.errors.name?.message}><TextField {...variableForm.register('name')} placeholder="Has pregnant mother" /></FormField>
          <FormField label="Value type" error={variableForm.formState.errors.value_type?.message}><DropdownSelect value={variableTypeValue} options={RULE_VARIABLE_TYPE_OPTIONS} onChange={(value) => variableForm.setValue('value_type', value, { shouldValidate: true })} /></FormField>
          <FormField label="Description" error={variableForm.formState.errors.description?.message}><textarea className="input textarea" rows="4" {...variableForm.register('description')} placeholder="Explain the fact represented by this variable." /></FormField>
          <FormField label="Status" error={variableForm.formState.errors.status_active?.message}><DropdownSelect value={variableStatusValue} options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]} onChange={(value) => variableForm.setValue('status_active', value, { shouldValidate: true })} /></FormField>
        </form>
      </Modal>

      <Modal open={ruleModal.open} title={ruleModal.rule ? 'Edit rule' : 'Create rule'} onClose={() => setRuleModal({ open: false, rule: null })} footer={<><Button type="button" variant="ghost" onClick={() => setRuleModal({ open: false, rule: null })}>Cancel</Button><Button type="submit" form="rule-form" disabled={ruleForm.formState.isSubmitting || ruleMutation.isPending}>Save rule</Button></>}>
        <form id="rule-form" className="stack-md" onSubmit={submitRule}>
          <FormField label="Name" error={ruleForm.formState.errors.name?.message}><TextField {...ruleForm.register('name')} placeholder="Eligibility rule 1" /></FormField>
          <FormField label="Priority" error={ruleForm.formState.errors.priority?.message}><TextField type="number" {...ruleForm.register('priority')} /></FormField>
          <FormField label="Logic type" error={ruleForm.formState.errors.logic_type?.message}><DropdownSelect value={ruleLogicTypeValue} options={[{ value: 'AND', label: 'AND' }, { value: 'OR', label: 'OR' }]} onChange={(value) => ruleForm.setValue('logic_type', value, { shouldValidate: true })} /></FormField>
          <FormField label="Action" error={ruleForm.formState.errors.action_type?.message}><DropdownSelect value={ruleActionTypeValue} options={RULE_ACTION_OPTIONS} onChange={(value) => ruleForm.setValue('action_type', value, { shouldValidate: true })} /></FormField>
          <FormField label="Category" error={ruleForm.formState.errors.category_id?.message}><DropdownSelect value={ruleCategoryValue} options={[{ value: '', label: selectedActionType === 'reject' ? 'Select rejected category' : 'Select ranked category' }, ...filteredCategories.map((item) => ({ value: String(item.id), label: `${item.name} (${item.code})` }))]} onChange={(value) => ruleForm.setValue('category_id', value, { shouldValidate: true })} /></FormField>
          <FormField label="Status" error={ruleForm.formState.errors.status_active?.message}><DropdownSelect value={ruleStatusValue} options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]} onChange={(value) => ruleForm.setValue('status_active', value, { shouldValidate: true })} /></FormField>
        </form>
      </Modal>

      <Modal open={conditionModal.open} title={conditionModal.rule ? `${conditionModal.condition ? 'Edit' : 'Add'} condition for ${conditionModal.rule.name || `Rule ${conditionModal.rule.priority}`}` : 'Condition'} onClose={() => setConditionModal({ open: false, rule: null, condition: null })} footer={<><Button type="button" variant="ghost" onClick={() => setConditionModal({ open: false, rule: null, condition: null })}>Cancel</Button><Button type="submit" form="rule-condition-form" disabled={conditionForm.formState.isSubmitting || conditionMutation.isPending}>Save condition</Button></>}>
        <form id="rule-condition-form" className="stack-md" onSubmit={submitCondition}>
          <FormField label="Rule variable" error={conditionForm.formState.errors.rule_variable_id?.message}><DropdownSelect value={selectedRuleVariableId} options={[{ value: '', label: 'Select variable' }, ...ruleVariables.map((item) => ({ value: String(item.id), label: `${item.code} - ${item.name}` }))]} onChange={(value) => conditionForm.setValue('rule_variable_id', value, { shouldValidate: true })} /></FormField>
          {selectedVariable ? <div className="rule-variable-help mini-card"><strong>{selectedVariable.code} - {selectedVariable.name}</strong><p>Value type: {RULE_VARIABLE_TYPE_OPTIONS.find((item) => item.value === selectedVariable.value_type)?.label || selectedVariable.value_type}</p></div> : null}
          <FormField label="Operator" error={conditionForm.formState.errors.operator?.message}><DropdownSelect value={conditionOperatorValue} options={[{ value: '=', label: '=' }, { value: '>', label: '>' }, { value: '<', label: '<' }, { value: '>=', label: '>=' }, { value: '<=', label: '<=' }]} onChange={(value) => conditionForm.setValue('operator', value, { shouldValidate: true })} /></FormField>
          <FormField label="Value" error={conditionForm.formState.errors.value?.message}><TextField {...conditionForm.register('value')} placeholder={selectedVariable?.value_type === 'boolean' ? 'true / false' : selectedVariable?.value_type === 'number' ? 'Enter numeric value' : 'Enter string value'} /></FormField>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(deleteState.item)} title={`Delete ${deleteState.type || 'item'}`} description={`Delete ${deleteState.type === 'rule' ? deleteState.item?.name : deleteState.type === 'variable' ? deleteState.item?.name : 'this condition'}?`} confirmLabel={(deleteState.type === 'variable' ? deleteVariableMutation.isPending : deleteState.type === 'rule' ? deleteRuleMutation.isPending : deleteConditionMutation.isPending) ? 'Deleting...' : 'Delete'} onClose={() => setDeleteState({ type: null, item: null })} onConfirm={handleDelete} />
    </div>
  )
}
