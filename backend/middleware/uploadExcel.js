const multer = require("multer")
const FileType = require("file-type")

const { ValidationError } = require("../utils/appError")

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
const XLSX_EXTENSION = ".xlsx"

// Browser/OS/office suite yang berbeda kirim MIME type berbeda untuk file .xlsx
// (mis. WPS Office: application/wps-office.xlsx, LibreOffice, Numbers, dll).
// Validasi konten sebenarnya tetap dilakukan oleh verifyMagicBytes() yang membaca
// magic bytes asli ZIP/XLSX, jadi filter MIME di sini cukup permisif untuk mencegah
// false reject. Kita tetap menolak MIME yang jelas berbeda (image, pdf, video, dll).
const ALLOWED_XLSX_MIMES = new Set([
   XLSX_MIME,
   "application/octet-stream",
   "application/zip",
   "application/x-zip",
   "application/x-zip-compressed",
   "application/vnd.ms-excel",
   "application/excel",
   "application/x-excel",
   "application/x-msexcel",
   ""
])

const XLSX_MIME_PATTERNS = [
   /xlsx/i,
   /excel/i,
   /spreadsheet/i,
   /wps-office/i,
   /openxmlformats/i,
   /^application\/zip/i,
   /^application\/x-zip/i
]

const isAllowedXlsxMime = (mimetype) => {
   if (!mimetype) return true
   if (ALLOWED_XLSX_MIMES.has(mimetype)) return true
   return XLSX_MIME_PATTERNS.some((pattern) => pattern.test(mimetype))
}

const getMaxFileSizeBytes = () => {
   const configured = Number(process.env.IMPORT_MAX_FILE_SIZE_MB)
   const safeConfigured = Number.isFinite(configured) && configured > 0 ? configured : 5
   return Math.floor(safeConfigured * 1024 * 1024)
}

const buildMulter = () => multer({
   storage: multer.memoryStorage(),
   limits: {
      fileSize: getMaxFileSizeBytes(),
      files: 1,
      fields: 10
   },
   fileFilter(req, file, callback) {
      const lowerName = String(file.originalname || "").toLowerCase()

      if (!lowerName.endsWith(XLSX_EXTENSION)) {
         return callback(new ValidationError("Only .xlsx files are allowed"))
      }

      const mimetype = String(file.mimetype || "").toLowerCase()

      if (!isAllowedXlsxMime(mimetype)) {
         return callback(new ValidationError(`File MIME type does not match .xlsx (received: ${file.mimetype})`))
      }

      callback(null, true)
   }
})

const verifyMagicBytes = async (buffer) => {
   if (!Buffer.isBuffer(buffer) || buffer.length < 4) {
      throw new ValidationError("Uploaded file is empty or unreadable")
   }

   const detected = await FileType.fromBuffer(buffer)

   if (!detected) {
      throw new ValidationError("Unable to detect file type")
   }

   if (detected.ext !== "xlsx" && detected.mime !== XLSX_MIME && detected.ext !== "zip") {
      throw new ValidationError("File content is not a valid .xlsx workbook")
   }
}

const handleUploadError = (error, res) => {
   if (error?.code === "LIMIT_FILE_SIZE") {
      const limitMb = Math.round(getMaxFileSizeBytes() / (1024 * 1024))
      return res.status(413).json({
         message: `File exceeds maximum size of ${limitMb} MB`
      })
   }

   if (error?.code === "LIMIT_FILE_COUNT" || error?.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
         message: "Only one file is allowed per upload"
      })
   }

   const status = error?.status || 400
   return res.status(status).json({
      message: error?.message || "Failed to upload file"
   })
}

const uploadSingle = (fieldName = "file") => {
   const handler = buildMulter().single(fieldName)

   return (req, res, next) => {
      handler(req, res, async (uploadError) => {
         if (uploadError) {
            return handleUploadError(uploadError, res)
         }

         if (!req.file) {
            return res.status(400).json({
               message: "File is required"
            })
         }

         try {
            await verifyMagicBytes(req.file.buffer)
            next()
         } catch (error) {
            return handleUploadError(error, res)
         }
      })
   }
}

module.exports = {
   uploadSingle,
   verifyMagicBytes,
   getMaxFileSizeBytes,
   XLSX_MIME,
   XLSX_EXTENSION
}
