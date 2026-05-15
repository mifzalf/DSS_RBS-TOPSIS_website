const RuleVariable = require("../../../models/rule-variable.model")

const builder = require("../workbook-builder.service")
const { RULE_VARIABLE_TYPES } = require("../../../constants/rule-variable-types")

const TEMPLATE_TYPE = "rule_evaluations"
const SHEET_NAME = "RuleEvaluations"
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

const loadActiveVariables = async (decisionModelId) => {
   const variables = await RuleVariable.findAll({
      where: { decision_model_id: decisionModelId, status_active: true },
      order: [["id", "ASC"]]
   })

   return variables.map((variable) => ({
      id: variable.id,
      code: variable.code,
      name: variable.name,
      value_type: variable.value_type,
      description: variable.description || ""
   }))
}

const formatHeader = (variable) => variable.code

const buildEvaluationLookup = (existingEvaluations = []) => {
   const lookup = new Map()
   for (const evaluation of existingEvaluations) {
      const key = `${evaluation.alternative_id}:${evaluation.rule_variable_id}`
      lookup.set(key, evaluation)
   }
   return lookup
}

const formatEvaluationValue = (evaluation, variable) => {
   if (!evaluation) return ""

   switch (variable.value_type) {
      case RULE_VARIABLE_TYPES.BOOLEAN:
         if (evaluation.value_boolean === null || evaluation.value_boolean === undefined) return ""
         return evaluation.value_boolean ? "true" : "false"
      case RULE_VARIABLE_TYPES.NUMBER:
         if (evaluation.value_number === null || evaluation.value_number === undefined) return ""
         return evaluation.value_number
      case RULE_VARIABLE_TYPES.STRING:
      default:
         if (!evaluation.value_string) return ""
         return evaluation.value_string
   }
}

const computeRowStatus = ({ filledCount, totalColumns }) => {
   if (totalColumns === 0) return "empty"
   if (filledCount === 0) return "empty"
   if (filledCount === totalColumns) return "complete"
   return "partial"
}

const buildRuleEvaluationTemplate = async ({
   decisionModelId,
   decisionModelName,
   alternatives = [],
   existingEvaluations = []
} = {}) => {
   const variables = await loadActiveVariables(decisionModelId)

   const workbook = builder.createWorkbook({
      description: decisionModelName
         ? `Rule evaluation template for ${decisionModelName}`
         : "Rule evaluation template"
   })

   const dataColumns = [
      { header: ALTERNATIVE_COLUMN_KEY, key: ALTERNATIVE_COLUMN_KEY, width: 36 },
      ...variables.map((variable) => ({
         header: formatHeader(variable),
         key: formatHeader(variable),
         width: Math.max(18, Math.min(40, variable.code.length + variable.name.length + 4))
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

   const totalVariables = variables.length
   const statusSummary = { complete: 0, partial: 0, empty: 0 }

   for (const alternative of alternatives) {
      const rowValues = { [ALTERNATIVE_COLUMN_KEY]: alternative.name }
      let filledCount = 0

      for (const variable of variables) {
         const key = `${alternative.id}:${variable.id}`
         const evaluation = evaluationLookup.get(key)
         const cellValue = formatEvaluationValue(evaluation, variable)
         rowValues[variable.code] = cellValue
         if (cellValue !== "" && cellValue !== null && cellValue !== undefined) {
            filledCount += 1
         }
      }

      const rowStatus = computeRowStatus({ filledCount, totalColumns: totalVariables })
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

   builder.writeMetadata(dataSheet, { decisionModelId, templateType: TEMPLATE_TYPE })

   const dropdownLastRow = Math.max(1000, alternatives.length + 50)
   variables.forEach((variable, index) => {
      const columnIndex = index + 2 // 1 = alternative_name
      const columnLetter = builder.columnLetterFor(columnIndex)

      if (variable.value_type === RULE_VARIABLE_TYPES.BOOLEAN) {
         builder.addDropdownValidation(dataSheet, columnLetter, ["true", "false"], dropdownLastRow)
      } else if (variable.value_type === RULE_VARIABLE_TYPES.NUMBER) {
         builder.addNumericValidation(dataSheet, columnLetter, dropdownLastRow)
      }
   })

   const summarySheet = workbook.addWorksheet("Summary")
   summarySheet.getColumn(1).width = 32
   summarySheet.getColumn(2).width = 14
   summarySheet.addRow(["Status", "Jumlah"])
   summarySheet.getRow(1).font = { bold: true }
   summarySheet.addRow([STATUS_LABELS.complete, statusSummary.complete])
   summarySheet.addRow([STATUS_LABELS.partial, statusSummary.partial])
   summarySheet.addRow([STATUS_LABELS.empty, statusSummary.empty])
   summarySheet.addRow(["Total alternatif", alternatives.length])
   summarySheet.addRow(["Total variabel rule aktif", totalVariables])

   builder.buildReferenceSheet({
      workbook,
      sheetName: REFERENCE_SHEET_NAME,
      columns: [
         { header: "variable_code", key: "variable_code", width: 22 },
         { header: "variable_name", key: "variable_name", width: 30 },
         { header: "value_type", key: "value_type", width: 14 },
         { header: "description", key: "description", width: 60 }
      ],
      rows: variables.map((variable) => ({
         variable_code: variable.code,
         variable_name: variable.name,
         value_type: variable.value_type,
         description: variable.description
      }))
   })

   builder.buildInstructionsSheet({
      workbook,
      title: "Panduan Import Evaluasi Rule",
      lines: [
         "Template ini sudah berisi semua alternatif yang terdaftar di decision model ini.",
         "Nilai evaluasi yang sudah pernah disimpan juga sudah terisi sehingga Anda hanya perlu mengubah/melengkapi.",
         "",
         "PETUNJUK PENGISIAN:",
         "1. Sheet utama untuk pengisian adalah 'RuleEvaluations'.",
         "2. Kolom 'alternative_name' tidak boleh diubah atau dihapus.",
         "3. Tiap kolom merupakan kode rule variable yang aktif. Lihat sheet 'Reference' untuk daftar lengkap.",
         "4. Format nilai sesuai value_type:",
         "   - boolean : true / false / 1 / 0 / ya / tidak / yes / no.",
         "   - number  : angka (gunakan titik sebagai pemisah desimal).",
         "   - string  : teks bebas, maksimal 255 karakter.",
         "5. Cell yang dikosongkan dianggap belum dievaluasi (tidak menghapus data lama).",
         "6. Kolom '_status' bersifat informatif (tidak ikut tersimpan).",
         "",
         "WARNA BARIS:",
         `- Hijau: ${STATUS_LABELS.complete} — semua variabel sudah terisi.`,
         `- Kuning: ${STATUS_LABELS.partial} — sebagian variabel belum terisi.`,
         `- Merah muda: ${STATUS_LABELS.empty} — alternatif belum dievaluasi sama sekali.`,
         "",
         "MODE IMPORT:",
         "- upsert (default) : data baru akan dibuat, data existing diperbarui.",
         "- create_only      : hanya menambah evaluasi baru, abaikan yang sudah ada.",
         "",
         "Variabel yang tidak aktif tidak akan muncul di template.",
         "Jika konfigurasi variabel/alternatif berubah, unduh ulang template agar tetap selaras."
      ]
   })

   return { workbook, statusSummary }
}

module.exports = {
   buildRuleEvaluationTemplate,
   loadActiveVariables,
   buildEvaluationLookup,
   computeRowStatus,
   formatEvaluationValue,
   STATUS_LABELS,
   STATUS_FILLS,
   TEMPLATE_TYPE,
   SHEET_NAME,
   REFERENCE_SHEET_NAME,
   ALTERNATIVE_COLUMN_KEY,
   STATUS_COLUMN_KEY,
   formatHeader
}
