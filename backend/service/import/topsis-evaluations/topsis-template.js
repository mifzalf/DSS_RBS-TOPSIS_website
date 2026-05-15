const Criteria = require("../../../models/criteria.model")

const builder = require("../workbook-builder.service")

const TEMPLATE_TYPE = "topsis_evaluations"
const SHEET_NAME = "Evaluations"
const REFERENCE_SHEET_NAME = "Reference"
const ALTERNATIVE_COLUMN_KEY = "alternative_name"
const STATUS_COLUMN_KEY = "_status"

const STATUS_FILLS = {
   complete: {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE7F8EC" }
   },
   partial: {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFF7E0" }
   },
   empty: {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFDECEC" }
   }
}

const STATUS_LABELS = {
   complete: "✓ Lengkap",
   partial: "⚠ Sebagian",
   empty: "○ Belum diisi"
}

const formatHeader = (criteria) => {
   const code = (criteria.code || "").trim()
   const name = (criteria.name || "").trim()
   if (code && name) return `${code} (${name})`
   return name || code || `Criteria ${criteria.id}`
}

const loadReferenceData = async (decisionModelId) => {
   const criteria = await Criteria.findAll({
      where: { decision_model_id: decisionModelId, status_active: true },
      include: [{ association: "subCriteria" }],
      order: [["id", "ASC"]]
   })

   return criteria.map((item) => ({
      id: item.id,
      code: item.code || "",
      name: item.name,
      type: item.type,
      weight: item.weight,
      header: formatHeader(item),
      sub_criteria: (item.subCriteria || []).map((sub) => ({
         id: sub.id,
         label: sub.label,
         value: sub.value
      }))
   }))
}

const buildEvaluationLookup = (existingEvaluations = []) => {
   const lookup = new Map()
   for (const evaluation of existingEvaluations) {
      const key = `${evaluation.alternative_id}:${evaluation.criteria_id}`
      lookup.set(key, evaluation)
   }
   return lookup
}

const computeRowStatus = ({ filledCount, totalColumns }) => {
   if (totalColumns === 0) return "empty"
   if (filledCount === 0) return "empty"
   if (filledCount === totalColumns) return "complete"
   return "partial"
}

const buildTopsisTemplate = async ({
   decisionModelId,
   decisionModelName,
   alternatives = [],
   existingEvaluations = []
} = {}) => {
   const criteria = await loadReferenceData(decisionModelId)

   const workbook = builder.createWorkbook({
      description: decisionModelName
         ? `TOPSIS evaluation template for ${decisionModelName}`
         : "TOPSIS evaluation template"
   })

   const dataColumns = [
      { header: ALTERNATIVE_COLUMN_KEY, key: ALTERNATIVE_COLUMN_KEY, width: 36 },
      ...criteria.map((item) => ({
         header: item.header,
         key: item.header,
         width: Math.max(20, Math.min(40, item.header.length + 4))
      })),
      { header: STATUS_COLUMN_KEY, key: STATUS_COLUMN_KEY, width: 18 }
   ]

   const evaluationLookup = buildEvaluationLookup(existingEvaluations)

   const dataSheet = builder.buildDataSheet({
      workbook,
      sheetName: SHEET_NAME,
      columns: dataColumns,
      sampleRows: []
   })

   const totalCriteria = criteria.length
   const statusSummary = { complete: 0, partial: 0, empty: 0 }

   for (const alternative of alternatives) {
      const rowValues = { [ALTERNATIVE_COLUMN_KEY]: alternative.name }
      let filledCount = 0

      for (const criterion of criteria) {
         const key = `${alternative.id}:${criterion.id}`
         const evaluation = evaluationLookup.get(key)
         const subCriteria = evaluation
            ? criterion.sub_criteria.find((sub) => sub.id === evaluation.sub_criteria_id)
            : null

         if (subCriteria) {
            rowValues[criterion.header] = subCriteria.label
            filledCount += 1
         } else {
            rowValues[criterion.header] = ""
         }
      }

      const rowStatus = computeRowStatus({ filledCount, totalColumns: totalCriteria })
      statusSummary[rowStatus] += 1
      rowValues[STATUS_COLUMN_KEY] = STATUS_LABELS[rowStatus]

      const row = dataSheet.addRow(rowValues)
      const fill = STATUS_FILLS[rowStatus]
      row.eachCell((cell) => {
         cell.fill = fill
      })
   }

   if (!alternatives.length) {
      const placeholderRow = dataSheet.addRow({
         [ALTERNATIVE_COLUMN_KEY]: "(belum ada alternatif terdaftar — tambahkan alternatif terlebih dulu)"
      })
      placeholderRow.eachCell((cell) => {
         cell.fill = STATUS_FILLS.empty
         cell.font = { italic: true, color: { argb: "FF9CA3AF" } }
      })
   }

   const summarySheet = workbook.addWorksheet("Summary")
   summarySheet.getColumn(1).width = 32
   summarySheet.getColumn(2).width = 14
   summarySheet.addRow(["Status", "Jumlah"])
   summarySheet.getRow(1).font = { bold: true }
   summarySheet.addRow([STATUS_LABELS.complete, statusSummary.complete])
   summarySheet.addRow([STATUS_LABELS.partial, statusSummary.partial])
   summarySheet.addRow([STATUS_LABELS.empty, statusSummary.empty])
   summarySheet.addRow(["Total alternatif", alternatives.length])
   summarySheet.addRow(["Total kriteria aktif", totalCriteria])

   builder.writeMetadata(dataSheet, { decisionModelId, templateType: TEMPLATE_TYPE })

   criteria.forEach((item, index) => {
      if (!item.sub_criteria.length) return
      const columnIndex = index + 2 // index 0 = alternative_name (kolom 1)
      const columnLetter = builder.columnLetterFor(columnIndex)
      const labels = item.sub_criteria.map((sub) => sub.label)
      builder.addDropdownValidation(dataSheet, columnLetter, labels, Math.max(1000, alternatives.length + 50))
   })

   const referenceRows = []
   for (const item of criteria) {
      if (!item.sub_criteria.length) {
         referenceRows.push({
            criteria_code: item.code,
            criteria_name: item.name,
            criteria_type: item.type,
            weight: item.weight,
            sub_criteria_label: "(belum ada sub-kriteria)",
            sub_criteria_value: null
         })
         continue
      }

      for (const sub of item.sub_criteria) {
         referenceRows.push({
            criteria_code: item.code,
            criteria_name: item.name,
            criteria_type: item.type,
            weight: item.weight,
            sub_criteria_label: sub.label,
            sub_criteria_value: sub.value
         })
      }
   }

   builder.buildReferenceSheet({
      workbook,
      sheetName: REFERENCE_SHEET_NAME,
      columns: [
         { header: "criteria_code", key: "criteria_code", width: 18 },
         { header: "criteria_name", key: "criteria_name", width: 28 },
         { header: "criteria_type", key: "criteria_type", width: 14 },
         { header: "weight", key: "weight", width: 10 },
         { header: "sub_criteria_label", key: "sub_criteria_label", width: 28 },
         { header: "sub_criteria_value", key: "sub_criteria_value", width: 18 }
      ],
      rows: referenceRows
   })

   builder.buildInstructionsSheet({
      workbook,
      title: "Panduan Import Evaluasi TOPSIS",
      lines: [
         "Template ini sudah berisi semua alternatif yang terdaftar di decision model ini.",
         "Nilai evaluasi yang sudah pernah disimpan juga sudah terisi sehingga Anda hanya perlu mengubah/melengkapi.",
         "",
         "PETUNJUK PENGISIAN:",
         "1. Sheet utama untuk pengisian adalah 'Evaluations'.",
         "2. Kolom 'alternative_name' tidak boleh diubah atau dihapus.",
         "3. Setiap kolom kriteria diisi dengan label sub-kriteria (lihat sheet 'Reference').",
         "4. Cell akan menampilkan dropdown sub-kriteria untuk membantu pengisian.",
         "5. Cell yang dikosongkan akan dianggap belum dievaluasi (tidak menghapus data lama).",
         "6. Kolom '_status' bersifat informatif (tidak ikut tersimpan).",
         "",
         "WARNA BARIS:",
         `- Hijau: ${STATUS_LABELS.complete} — semua kriteria sudah terisi.`,
         `- Kuning: ${STATUS_LABELS.partial} — sebagian kriteria belum terisi.`,
         `- Merah muda: ${STATUS_LABELS.empty} — alternatif belum dievaluasi sama sekali.`,
         "",
         "MODE IMPORT:",
         "- upsert (default) : data baru akan dibuat, data existing diperbarui.",
         "- create_only      : hanya menambah evaluasi baru, abaikan yang sudah ada.",
         "",
         "Jika kriteria/sub-kriteria/alternatif berubah di sistem, unduh ulang template agar tetap selaras."
      ]
   })

   return { workbook, statusSummary }
}

module.exports = {
   buildTopsisTemplate,
   loadReferenceData,
   formatHeader,
   buildEvaluationLookup,
   computeRowStatus,
   STATUS_LABELS,
   STATUS_FILLS,
   TEMPLATE_TYPE,
   SHEET_NAME,
   REFERENCE_SHEET_NAME,
   ALTERNATIVE_COLUMN_KEY,
   STATUS_COLUMN_KEY
}
