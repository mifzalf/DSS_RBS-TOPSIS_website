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
  code: z.string().min(1, 'Kode wajib diisi.').max(30, 'Maksimal 30 karakter.'),
  name: z.string().min(1, 'Nama wajib diisi.').max(150, 'Maksimal 150 karakter.'),
  value_type: z.enum(['boolean', 'number', 'string']),
  description: z.string().max(5000, 'Maksimal 5000 karakter.').optional().or(z.literal('')),
  status_active: z.enum(['true', 'false']),
})

const ruleSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi.').max(150, 'Maksimal 150 karakter.'),
  priority: z.coerce.number().int().min(1, 'Prioritas minimal adalah 1.'),
  logic_type: z.enum(['AND', 'OR', 'EMPTY']),
  action_type: z.enum(['assign_benefit', 'reject']),
  category_id: z.string().min(1, 'Tipe keputusan wajib dipilih.'),
  status_active: z.enum(['true', 'false']),
})

const conditionSchema = z.object({
  rule_variable_id: z.string().min(1, 'Variabel rule wajib dipilih.'),
  operator: z.enum(['=', '>', '<', '>=', '<=']),
  value: z.string().min(1, 'Nilai wajib diisi.'),
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

  if (isLoading) return <LoadingState title="Memuat Rule Base" description="Menyiapkan variabel rule, rule, dan kondisi turunannya." />
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
        pushToast({ title: 'Variabel rule diperbarui', description: 'Definisi fakta bertipe berhasil diperbarui.', tone: 'success' })
      } else {
        await createVariableMutation.mutateAsync(payload)
        pushToast({ title: 'Variabel rule ditambahkan', description: 'Fakta bertipe baru siap digunakan pada kondisi rule.', tone: 'success' })
      }
      setVariableModal({ open: false, variable: null })
    } catch (submitError) {
      pushToast({ title: 'Permintaan variabel rule gagal', description: submitError.message, tone: 'error' })
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
      pushToast({ title: ruleModal.rule ? 'Rule diperbarui' : 'Rule ditambahkan', description: 'Konfigurasi rule berhasil disimpan.', tone: 'success' })
      setRuleModal({ open: false, rule: null })
    } catch (submitError) {
      pushToast({ title: 'Permintaan rule gagal', description: submitError.message, tone: 'error' })
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
      pushToast({ title: conditionModal.condition ? 'Kondisi diperbarui' : 'Kondisi ditambahkan', description: 'Kondisi rule berhasil disimpan.', tone: 'success' })
      setConditionModal({ open: false, rule: null, condition: null })
    } catch (submitError) {
      pushToast({ title: 'Permintaan kondisi gagal', description: submitError.message, tone: 'error' })
    }
  })

  const handleDelete = async () => {
    try {
      if (deleteState.type === 'variable') {
        await deleteVariableMutation.mutateAsync(deleteState.item.id)
        pushToast({ title: 'Variabel rule dihapus', description: 'Definisi fakta bertipe berhasil dihapus.', tone: 'success' })
      }
      if (deleteState.type === 'rule') {
        await deleteRuleMutation.mutateAsync(deleteState.item.id)
        pushToast({ title: 'Rule dihapus', description: 'Konfigurasi rule berhasil dihapus.', tone: 'success' })
      }
      if (deleteState.type === 'condition') {
        await deleteConditionMutation.mutateAsync(deleteState.item.id)
        pushToast({ title: 'Kondisi dihapus', description: 'Kondisi rule berhasil dihapus.', tone: 'success' })
      }
      setDeleteState({ type: null, item: null })
    } catch (deleteError) {
      pushToast({ title: 'Permintaan hapus gagal', description: deleteError.message, tone: 'error' })
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Rule Base"
        title="Kelola Rule Base"
      />

      <div className="content-grid two-column">
        <SectionCard title="Variabel rule" actions={<Button type="button" onClick={openCreateVariable}>Tambah variabel</Button>}>
          <div className="rule-card-list">
            {ruleVariables.length ? ruleVariables.map((variable) => (
              <article key={variable.id} className="rule-card">
                <div className="rule-card-head">
                  <div>
                    <strong>{variable.code} - {variable.name}</strong>
                    <p>{variable.description || 'Belum ada deskripsi.'}</p>
                  </div>
                  <div className="rule-card-badges">
                    <Badge tone="info">{variable.value_type}</Badge>
                    <Badge tone={variable.status_active ? 'success' : 'neutral'}>{variable.status_active ? 'aktif' : 'nonaktif'}</Badge>
                  </div>
                </div>
                <div className="rule-card-meta-row">
                  <Badge tone="info">Fakta bertipe</Badge>
                  <ActionMenu items={[{ label: 'Ubah variabel', onSelect: () => openEditVariable(variable) }, { label: 'Hapus variabel', tone: 'danger', onSelect: () => setDeleteState({ type: 'variable', item: variable }) }]} />
                </div>
              </article>
            )) : <p className="subtle-text">Belum ada variabel rule.</p>}</div>
        </SectionCard>

        <SectionCard title="Rule" actions={<Button type="button" onClick={openCreateRule}>Tambah rule</Button>}>
          <div className="rule-card-list">
            {data.length ? data.map((rule) => (
              <article key={rule.id} className="rule-card">
                <div className="rule-card-head">
                  <div>
                    <strong>{rule.name || `Rule ${rule.priority}`}</strong>
                    <p>Prioritas {rule.priority} · {rule.logic_type}</p>
                  </div>
                  <div className="rule-card-badges">
                    <Badge tone={rule.action_type === 'reject' ? 'warning' : 'success'}>{rule.action_type === 'reject' ? 'tolak' : 'tetapkan tipe keputusan'}</Badge>
                    <Badge tone={rule.status_active ? 'success' : 'neutral'}>{rule.status_active ? 'aktif' : 'nonaktif'}</Badge>
                  </div>
                </div>
                <div className="rule-card-target"><span>Tipe keputusan target</span><strong>{rule.categoryRef?.name || `Tipe #${rule.category_id}`}</strong></div>
                <div className="rule-card-meta-row">
                  <Badge tone={rule.action_type === 'reject' ? 'warning' : 'success'}>{RULE_ACTION_OPTIONS.find((item) => item.value === rule.action_type)?.label || rule.action_type}</Badge>
                  <ActionMenu items={[
                    ...(rule.logic_type !== 'EMPTY' ? [{ label: 'Tambah kondisi', onSelect: () => openCreateCondition(rule) }] : []),
                    { label: 'Ubah rule', onSelect: () => openEditRule(rule) },
                    { label: 'Hapus rule', tone: 'danger', onSelect: () => setDeleteState({ type: 'rule', item: rule }) },
                  ]} />
                </div>
                {rule.logic_type === 'EMPTY' ? (
                  <div className="rule-condition-item"><p className="subtle-text">Kondisi tidak diperlukan. Rule ini akan otomatis cocok jika semua variabel aktif bernilai null atau false.</p></div>
                ) : (
                  <div className="rule-condition-list">
                    {rule.conditions.length ? rule.conditions.map((condition) => (
                      <div key={condition.id} className="rule-condition-item">
                        <div>
                          <strong>{condition.ruleVariable ? `${condition.ruleVariable.code} · ${condition.ruleVariable.name}` : condition.field}</strong>
                          <span>{condition.operator} {condition.value}</span>
                        </div>
                        <ActionMenu items={[{ label: 'Ubah kondisi', onSelect: () => openEditCondition(rule, condition) }, { label: 'Hapus kondisi', tone: 'danger', onSelect: () => setDeleteState({ type: 'condition', item: condition }) }]} />
                      </div>
                    )) : <p>Belum ada kondisi.</p>}
                  </div>
                )}
              </article>
            )) : <p className="subtle-text">Belum ada rule.</p>}
          </div>
        </SectionCard>
      </div>

      <Modal open={variableModal.open} title={variableModal.variable ? 'Ubah variabel rule' : 'Tambah variabel rule'} onClose={() => setVariableModal({ open: false, variable: null })} footer={<><Button type="button" variant="ghost" onClick={() => setVariableModal({ open: false, variable: null })}>Batal</Button><Button type="submit" form="rule-variable-form" disabled={variableForm.formState.isSubmitting || createVariableMutation.isPending || updateVariableMutation.isPending}>Simpan variabel</Button></>}>
        <form id="rule-variable-form" className="stack-md" onSubmit={submitVariable}>
          <FormField label="Kode" error={variableForm.formState.errors.code?.message}><TextField {...variableForm.register('code')} placeholder="V1" /></FormField>
          <FormField label="Nama" error={variableForm.formState.errors.name?.message}><TextField {...variableForm.register('name')} placeholder="Terdapat ibu hamil" /></FormField>
          <FormField label="Tipe nilai" error={variableForm.formState.errors.value_type?.message}><DropdownSelect value={variableTypeValue} options={RULE_VARIABLE_TYPE_OPTIONS} onChange={(value) => variableForm.setValue('value_type', value, { shouldValidate: true })} /></FormField>
          <FormField label="Deskripsi" error={variableForm.formState.errors.description?.message}><textarea className="input textarea" rows="4" {...variableForm.register('description')} placeholder="Jelaskan fakta yang direpresentasikan variabel ini." /></FormField>
          <FormField label="Status" error={variableForm.formState.errors.status_active?.message}><DropdownSelect value={variableStatusValue} options={[{ value: 'true', label: 'Aktif' }, { value: 'false', label: 'Nonaktif' }]} onChange={(value) => variableForm.setValue('status_active', value, { shouldValidate: true })} /></FormField>
        </form>
      </Modal>

      <Modal open={ruleModal.open} title={ruleModal.rule ? 'Ubah rule' : 'Tambah rule'} onClose={() => setRuleModal({ open: false, rule: null })} footer={<><Button type="button" variant="ghost" onClick={() => setRuleModal({ open: false, rule: null })}>Batal</Button><Button type="submit" form="rule-form" disabled={ruleForm.formState.isSubmitting || ruleMutation.isPending}>Simpan rule</Button></>}>
        <form id="rule-form" className="stack-md" onSubmit={submitRule}>
          <FormField label="Nama" error={ruleForm.formState.errors.name?.message}><TextField {...ruleForm.register('name')} placeholder="Rule kelayakan 1" /></FormField>
          <FormField label="Prioritas" error={ruleForm.formState.errors.priority?.message}><TextField type="number" {...ruleForm.register('priority')} /></FormField>
          <FormField label="Tipe logika" error={ruleForm.formState.errors.logic_type?.message}><DropdownSelect value={ruleLogicTypeValue} options={[{ value: 'AND', label: 'AND' }, { value: 'OR', label: 'OR' }, { value: 'EMPTY', label: 'EMPTY (semua null/false)' }]} onChange={(value) => ruleForm.setValue('logic_type', value, { shouldValidate: true })} /></FormField>
          <FormField label="Aksi" error={ruleForm.formState.errors.action_type?.message}><DropdownSelect value={ruleActionTypeValue} options={RULE_ACTION_OPTIONS} onChange={(value) => ruleForm.setValue('action_type', value, { shouldValidate: true })} /></FormField>
          <FormField label="Tipe keputusan" error={ruleForm.formState.errors.category_id?.message}><DropdownSelect value={ruleCategoryValue} options={[{ value: '', label: selectedActionType === 'reject' ? 'Pilih tipe ditolak' : 'Pilih tipe diperingkat' }, ...filteredCategories.map((item) => ({ value: String(item.id), label: `${item.name} (${item.code})` }))]} onChange={(value) => ruleForm.setValue('category_id', value, { shouldValidate: true })} /></FormField>
          <FormField label="Status" error={ruleForm.formState.errors.status_active?.message}><DropdownSelect value={ruleStatusValue} options={[{ value: 'true', label: 'Aktif' }, { value: 'false', label: 'Nonaktif' }]} onChange={(value) => ruleForm.setValue('status_active', value, { shouldValidate: true })} /></FormField>
        </form>
      </Modal>

      <Modal open={conditionModal.open} title={conditionModal.rule ? `${conditionModal.condition ? 'Ubah' : 'Tambah'} kondisi untuk ${conditionModal.rule.name || `Rule ${conditionModal.rule.priority}`}` : 'Kondisi'} onClose={() => setConditionModal({ open: false, rule: null, condition: null })} footer={<><Button type="button" variant="ghost" onClick={() => setConditionModal({ open: false, rule: null, condition: null })}>Batal</Button><Button type="submit" form="rule-condition-form" disabled={conditionForm.formState.isSubmitting || conditionMutation.isPending}>Simpan kondisi</Button></>}>
        <form id="rule-condition-form" className="stack-md" onSubmit={submitCondition}>
          <FormField label="Variabel rule" error={conditionForm.formState.errors.rule_variable_id?.message}><DropdownSelect value={selectedRuleVariableId} options={[{ value: '', label: 'Pilih variabel' }, ...ruleVariables.map((item) => ({ value: String(item.id), label: `${item.code} - ${item.name}` }))]} onChange={(value) => conditionForm.setValue('rule_variable_id', value, { shouldValidate: true })} /></FormField>
          {selectedVariable ? <div className="rule-variable-help mini-card"><strong>{selectedVariable.code} - {selectedVariable.name}</strong><p>Tipe nilai: {RULE_VARIABLE_TYPE_OPTIONS.find((item) => item.value === selectedVariable.value_type)?.label || selectedVariable.value_type}</p></div> : null}
          <FormField label="Operator" error={conditionForm.formState.errors.operator?.message}><DropdownSelect value={conditionOperatorValue} options={[{ value: '=', label: '=' }, { value: '>', label: '>' }, { value: '<', label: '<' }, { value: '>=', label: '>=' }, { value: '<=', label: '<=' }]} onChange={(value) => conditionForm.setValue('operator', value, { shouldValidate: true })} /></FormField>
          <FormField label="Nilai" error={conditionForm.formState.errors.value?.message}><TextField {...conditionForm.register('value')} placeholder={selectedVariable?.value_type === 'boolean' ? 'true / false' : selectedVariable?.value_type === 'number' ? 'Masukkan nilai angka' : 'Masukkan nilai teks'} /></FormField>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(deleteState.item)} title={`Hapus ${deleteState.type === 'variable' ? 'variabel' : deleteState.type === 'rule' ? 'rule' : 'kondisi'}`} description={`Hapus ${deleteState.type === 'rule' ? deleteState.item?.name : deleteState.type === 'variable' ? deleteState.item?.name : 'kondisi ini'}?`} confirmLabel={(deleteState.type === 'variable' ? deleteVariableMutation.isPending : deleteState.type === 'rule' ? deleteRuleMutation.isPending : deleteConditionMutation.isPending) ? 'Menghapus...' : 'Hapus'} onClose={() => setDeleteState({ type: null, item: null })} onConfirm={handleDelete} />
    </div>
  )
}
