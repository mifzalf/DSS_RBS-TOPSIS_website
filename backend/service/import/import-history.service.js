const ImportHistory = require("../../models/import-history.model")

const truncate = (value, max = 5000) => {
   if (value === null || value === undefined) return null
   const text = typeof value === "string" ? value : JSON.stringify(value)
   if (text.length <= max) return text
   return `${text.slice(0, max - 3)}...`
}

const recordImport = async ({
   decisionModelId,
   userId,
   importType,
   mode,
   fileName,
   totalRows,
   createdCount,
   updatedCount,
   skippedCount,
   status,
   errorSummary,
   durationMs,
   transaction
} = {}) => {
   try {
      return await ImportHistory.create({
         decision_model_id: decisionModelId,
         user_id: userId,
         import_type: importType,
         mode,
         file_name: fileName ? String(fileName).slice(0, 255) : null,
         total_rows: Number(totalRows || 0),
         created_count: Number(createdCount || 0),
         updated_count: Number(updatedCount || 0),
         skipped_count: Number(skippedCount || 0),
         status,
         error_summary: errorSummary ? truncate(errorSummary) : null,
         duration_ms: Number.isFinite(Number(durationMs)) ? Number(durationMs) : null,
         created_at: new Date()
      }, transaction ? { transaction } : undefined)
   } catch (error) {
      // Audit logging tidak boleh menggagalkan fitur utama
      console.error("Failed to record import history", error?.message || error)
      return null
   }
}

const listHistory = async ({ decisionModelId, limit = 50 } = {}) => {
   return ImportHistory.findAll({
      where: { decision_model_id: decisionModelId },
      include: [{ association: "user", attributes: ["id", "name", "username"] }],
      order: [["created_at", "DESC"]],
      limit: Math.min(Number(limit) || 50, 200)
   })
}

module.exports = {
   recordImport,
   listHistory
}
