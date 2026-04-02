const RESULT_GRADE_CODES = Object.freeze({
   HIGH_PRIORITY: "high_priority",
   MEDIUM_PRIORITY: "medium_priority",
   LOW_PRIORITY: "low_priority",
   NOT_ELIGIBLE: "not_eligible"
})

const RESULT_GRADE_LABELS = Object.freeze({
   [RESULT_GRADE_CODES.HIGH_PRIORITY]: "High priority",
   [RESULT_GRADE_CODES.MEDIUM_PRIORITY]: "Medium priority",
   [RESULT_GRADE_CODES.LOW_PRIORITY]: "Low priority",
   [RESULT_GRADE_CODES.NOT_ELIGIBLE]: "Not eligible"
})

module.exports = {
   RESULT_GRADE_CODES,
   RESULT_GRADE_LABELS
}
