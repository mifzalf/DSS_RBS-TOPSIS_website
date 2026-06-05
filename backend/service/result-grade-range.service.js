const ResultGradeRange = require("../models/result-grade-range.model")
const ResultGradePolicy = require("../models/result-grade-policy.model")
const { NotFoundError, ValidationError } = require("../utils/appError")

// Mekanisme grade range berbasis "threshold turun":
// - Yang disimpan hanyalah max_score per range (batas atas inclusive).
// - Batas bawah setiap range dihitung otomatis dari max_score range yang lebih
//   rendah satu tingkat di bawahnya. Range paling bawah memiliki batas bawah 0.
// - Konsekuensinya tidak ada lagi konsep overlap antar range; cukup pastikan
//   max_score tiap range dalam satu policy unik dan berada di [0, 1].
// Catatan: kolom min_score sengaja dibiarkan ada di schema untuk backward
// compatibility, tetapi tidak lagi divalidasi maupun dipakai dalam resolusi
// grade (lihat grading.service.js).

const SCORE_COMPARISON_PRECISION = 6

const roundScore = (value) => {
   if (!Number.isFinite(value)) return value
   const factor = 10 ** SCORE_COMPARISON_PRECISION
   return Math.round(value * factor) / factor
}

const validateMaxScore = (value) => {
   if (value === null || value === undefined) {
      throw new ValidationError("max_score is required")
   }

   const numeric = Number(value)

   if (!Number.isFinite(numeric)) {
      throw new ValidationError("max_score must be a number")
   }

   if (numeric < 0 || numeric > 1) {
      throw new ValidationError("max_score must be between 0 and 1")
   }

   return roundScore(numeric)
}

const validateUniqueMaxScore = async ({ policyId, nextMaxScore, currentId }) => {
   const ranges = await ResultGradeRange.findAll({
      where: { result_grade_policy_id: policyId }
   })

   const rounded = roundScore(nextMaxScore)

   for (const range of ranges) {
      if (currentId && range.id === currentId) continue
      if (range.max_score === null || range.max_score === undefined) continue

      if (roundScore(Number(range.max_score)) === rounded) {
         throw new ValidationError("Each grade range must have a unique max score within the same policy")
      }
   }
}

const createGradeRange = async (payload) => {
   const policy = await ResultGradePolicy.findByPk(payload.result_grade_policy_id)

   if (!policy) {
      throw new NotFoundError("Result grade policy not found")
   }

   const maxScore = validateMaxScore(payload.max_score)

   await validateUniqueMaxScore({
      policyId: policy.id,
      nextMaxScore: maxScore
   })

   return ResultGradeRange.create({
      ...payload,
      min_score: null,
      max_score: maxScore,
      created_at: new Date()
   })
}

const updateGradeRange = async (range, payload) => {
   const updates = {}

   if (payload.max_score !== undefined) {
      const maxScore = validateMaxScore(payload.max_score)

      await validateUniqueMaxScore({
         policyId: range.result_grade_policy_id,
         nextMaxScore: maxScore,
         currentId: range.id
      })

      updates.max_score = maxScore
   }

   // min_score tidak lagi dipakai untuk menentukan grade; pastikan tetap null
   // untuk menghindari kebingungan dengan data lama.
   updates.min_score = null

   if (payload.label !== undefined) updates.label = payload.label
   if (payload.code !== undefined) updates.code = payload.code
   if (payload.sort_order !== undefined) updates.sort_order = payload.sort_order
   if (payload.result_status !== undefined) updates.result_status = payload.result_status

   await range.update(updates)
   return range
}

module.exports = {
   createGradeRange,
   updateGradeRange
}
