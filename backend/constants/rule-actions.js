const RULE_ACTION_TYPES = Object.freeze({
   ASSIGN_BENEFIT: "assign_benefit",
   REJECT: "reject"
})

const RULE_ACTION_TYPE_VALUES = Object.values(RULE_ACTION_TYPES)
const DEFAULT_REJECTED_CATEGORY = "Not eligible"

module.exports = {
   DEFAULT_REJECTED_CATEGORY,
   RULE_ACTION_TYPES,
   RULE_ACTION_TYPE_VALUES
}
