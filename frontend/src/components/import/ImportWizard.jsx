import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { ImportDropzone } from './ImportDropzone'
import { ImportSummary } from './ImportSummary'
import { ImportPreviewTable } from './ImportPreviewTable'
import { useFeedback } from '../../app/providers/useFeedback'
import {
  useCommitImport,
  useDownloadImportTemplate,
  usePreviewImport,
} from '../../features/import/useImport'
import {
  IMPORT_DESCRIPTIONS,
  IMPORT_MODES,
  IMPORT_MODE_OPTIONS,
  IMPORT_TITLES,
} from '../../features/import/import.constants'

const STEPS = {
  UPLOAD: 'upload',
  PREVIEW: 'preview',
  RESULT: 'result',
}

export function ImportWizard({
  open,
  decisionModelId,
  kind,
  onClose,
  onCompleted,
}) {
  if (!open) {
    return null
  }

  return (
    <ImportWizardContent
      decisionModelId={decisionModelId}
      kind={kind}
      onClose={onClose}
      onCompleted={onCompleted}
    />
  )
}

function ImportWizardContent({ decisionModelId, kind, onClose, onCompleted }) {
  const { pushToast } = useFeedback()
  const [step, setStep] = useState(STEPS.UPLOAD)
  const [file, setFile] = useState(null)
  const [mode, setMode] = useState(IMPORT_MODES.UPSERT)
  const [skipInvalid, setSkipInvalid] = useState(true)
  const [previewToken, setPreviewToken] = useState(null)
  const [previewData, setPreviewData] = useState(null)
  const [commitResult, setCommitResult] = useState(null)

  const downloadTemplate = useDownloadImportTemplate(decisionModelId, kind)
  const previewMutation = usePreviewImport(decisionModelId, kind)
  const commitMutation = useCommitImport(decisionModelId, kind)

  const handleDownloadTemplate = async () => {
    try {
      await downloadTemplate.mutateAsync()
      pushToast({ title: 'Template diunduh', description: 'Periksa folder unduhan Anda.', tone: 'success' })
    } catch (error) {
      pushToast({ title: 'Gagal mengunduh template', description: error.message, tone: 'error' })
    }
  }

  const handlePreview = async () => {
    if (!file) {
      pushToast({ title: 'Pilih file dulu', description: 'Tarik atau pilih file .xlsx untuk dipratinjau.', tone: 'warning' })
      return
    }
    try {
      const response = await previewMutation.mutateAsync({ file, mode })
      setPreviewToken(response.data.preview_token)
      setPreviewData(response.data)
      setStep(STEPS.PREVIEW)
    } catch (error) {
      pushToast({ title: 'Gagal memproses file', description: error.message, tone: 'error' })
    }
  }

  const handleCommit = async () => {
    if (!previewToken) return
    try {
      const response = await commitMutation.mutateAsync({ previewToken, skipInvalid })
      setCommitResult(response.data)
      setStep(STEPS.RESULT)
      onCompleted?.(response.data)
      pushToast({
        title: 'Import berhasil',
        description: `${response.data.created} dibuat · ${response.data.updated} diperbarui · ${response.data.skipped} dilewati.`,
        tone: 'success',
      })
    } catch (error) {
      pushToast({ title: 'Gagal menyimpan import', description: error.message, tone: 'error' })
    }
  }

  const handleBackToUpload = () => {
    setStep(STEPS.UPLOAD)
    setPreviewToken(null)
    setPreviewData(null)
  }

  const totalChanges = previewData ? (previewData.summary?.to_create || 0) + (previewData.summary?.to_update || 0) : 0
  const hasInvalid = previewData?.summary?.invalid_count > 0

  const title = IMPORT_TITLES[kind] || 'Import Excel'
  const description = IMPORT_DESCRIPTIONS[kind] || ''

  return (
    <Modal
      open
      title={title}
      onClose={onClose}
      footer={renderFooter({
        step,
        onClose,
        handleBackToUpload,
        handlePreview,
        handleCommit,
        previewLoading: previewMutation.isPending,
        commitLoading: commitMutation.isPending,
        canCommit: previewData ? totalChanges > 0 : false,
      })}
    >
      <div className="stack-md import-wizard">
        {description ? <p className="subtle-text">{description}</p> : null}

        {step === STEPS.UPLOAD ? (
          <UploadStep
            file={file}
            setFile={setFile}
            mode={mode}
            setMode={setMode}
            onDownloadTemplate={handleDownloadTemplate}
            templateLoading={downloadTemplate.isPending}
          />
        ) : null}

        {step === STEPS.PREVIEW && previewData ? (
          <PreviewStep
            kind={kind}
            previewData={previewData}
            skipInvalid={skipInvalid}
            setSkipInvalid={setSkipInvalid}
            hasInvalid={hasInvalid}
          />
        ) : null}

        {step === STEPS.RESULT && commitResult ? (
          <ResultStep result={commitResult} onClose={onClose} />
        ) : null}
      </div>
    </Modal>
  )
}

function renderFooter({ step, onClose, handleBackToUpload, handlePreview, handleCommit, previewLoading, commitLoading, canCommit }) {
  if (step === STEPS.UPLOAD) {
    return (
      <>
        <Button type="button" variant="ghost" onClick={onClose} disabled={previewLoading}>Batal</Button>
        <Button type="button" onClick={handlePreview} disabled={previewLoading}>
          {previewLoading ? 'Memproses...' : 'Pratinjau'}
        </Button>
      </>
    )
  }

  if (step === STEPS.PREVIEW) {
    return (
      <>
        <Button type="button" variant="ghost" onClick={handleBackToUpload} disabled={commitLoading}>Kembali</Button>
        <Button type="button" onClick={handleCommit} disabled={commitLoading || !canCommit}>
          {commitLoading ? 'Menyimpan...' : 'Konfirmasi Import'}
        </Button>
      </>
    )
  }

  return (
    <Button type="button" onClick={onClose}>Tutup</Button>
  )
}

function UploadStep({ file, setFile, mode, setMode, onDownloadTemplate, templateLoading }) {
  return (
    <div className="stack-md">
      <div className="import-template-row">
        <div>
          <strong>Template Excel</strong>
          <p className="subtle-text">Template di-generate dari konfigurasi decision model saat ini.</p>
        </div>
        <Button type="button" variant="secondary" onClick={onDownloadTemplate} disabled={templateLoading}>
          {templateLoading ? 'Mengunduh...' : 'Unduh template'}
        </Button>
      </div>

      <ImportDropzone value={file} onChange={setFile} />

      <fieldset className="import-mode-fieldset">
        <legend>Mode import</legend>
        <div className="import-mode-options">
          {IMPORT_MODE_OPTIONS.map((option) => (
            <label key={option.value} className={`import-mode-option ${mode === option.value ? 'is-selected' : ''}`}>
              <input
                type="radio"
                name="import-mode"
                value={option.value}
                checked={mode === option.value}
                onChange={() => setMode(option.value)}
              />
              <div>
                <strong>{option.label}</strong>
                <small className="subtle-text">{option.description}</small>
              </div>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  )
}

function PreviewStep({ kind, previewData, skipInvalid, setSkipInvalid, hasInvalid }) {
  return (
    <div className="stack-md">
      <ImportSummary summary={previewData.summary} />

      {previewData.warnings?.length ? (
        <div className="import-warning-banner">
          <strong>Peringatan</strong>
          <ul>
            {previewData.warnings.map((warning, index) => (
              <li key={index}>{warning.message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <ImportPreviewTable kind={kind} rows={previewData.rows} />

      {hasInvalid ? (
        <label className="import-skip-toggle">
          <input
            type="checkbox"
            checked={skipInvalid}
            onChange={(event) => setSkipInvalid(event.target.checked)}
          />
          <span>Lewati baris bermasalah dan lanjutkan import baris yang valid.</span>
        </label>
      ) : null}
    </div>
  )
}

function ResultStep({ result }) {
  return (
    <div className="stack-md">
      <div className="import-result-card">
        <Badge tone="success">Berhasil</Badge>
        <h3>{result.created + result.updated} perubahan diterapkan</h3>
        <p>{result.created} dibuat · {result.updated} diperbarui · {result.skipped} dilewati.</p>
        <small className="subtle-text">Selesai dalam {result.duration_ms} ms.</small>
      </div>

      {result.side_effects?.recommendation_invalidated ? (
        <div className="import-warning-banner">
          <strong>Catatan</strong>
          <p>Hasil rekomendasi sebelumnya mungkin sudah tidak relevan. Silakan generate ulang rekomendasi setelah import.</p>
        </div>
      ) : null}
    </div>
  )
}
