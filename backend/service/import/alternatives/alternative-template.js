const builder = require("../workbook-builder.service")

const TEMPLATE_TYPE = "alternatives"

const ALTERNATIVE_COLUMNS = [
   { header: "name", key: "name", width: 36 },
   { header: "description", key: "description", width: 70 }
]

const SAMPLE_ROWS = [
   { name: "Rumah Tangga A", description: "Contoh: warga RT 01 RW 02" },
   { name: "Rumah Tangga B", description: "Contoh: warga RT 03 RW 02" }
]

const INSTRUCTIONS = [
   "PANDUAN PENGISIAN ALTERNATIF",
   "",
   "1. Sheet aktif untuk pengisian adalah 'Alternatives'.",
   "2. Kolom 'name' wajib diisi dan harus unik per decision model. Maksimal 150 karakter.",
   "3. Kolom 'description' opsional. Maksimal 5000 karakter.",
   "4. Baris yang seluruhnya kosong akan diabaikan oleh sistem.",
   "5. Jangan mengubah nama sheet ataupun header kolom.",
   "6. Pastikan template diunduh dari decision model yang sama dengan tujuan import.",
   "",
   "MODE IMPORT:",
   "- create_only : hanya membuat alternatif baru. Nama yang sudah ada akan ditolak.",
   "- upsert      : tambah baru, atau perbarui description jika nama sudah ada.",
   "",
   "Setelah file diisi, simpan sebagai .xlsx lalu unggah pada halaman Import."
]

const buildAlternativeTemplate = ({ decisionModelId, decisionModelName } = {}) => {
   const workbook = builder.createWorkbook({
      description: decisionModelName ? `Alternative import template for ${decisionModelName}` : "Alternative import template"
   })

   const dataSheet = builder.buildDataSheet({
      workbook,
      sheetName: "Alternatives",
      columns: ALTERNATIVE_COLUMNS,
      sampleRows: SAMPLE_ROWS
   })

   builder.writeMetadata(dataSheet, { decisionModelId, templateType: TEMPLATE_TYPE })

   builder.buildInstructionsSheet({
      workbook,
      title: "Panduan Import Alternatif",
      lines: INSTRUCTIONS
   })

   return workbook
}

module.exports = {
   buildAlternativeTemplate,
   TEMPLATE_TYPE,
   ALTERNATIVE_COLUMNS
}
