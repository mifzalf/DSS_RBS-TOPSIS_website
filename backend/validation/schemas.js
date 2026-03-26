const positiveId = { type: "integer", required: true, min: 1 }

module.exports = {
   auth: {
      register: {
         body: {
            name: { type: "string", required: true, minLength: 1, maxLength: 100 },
            username: { type: "string", required: true, minLength: 3, maxLength: 50 },
            password: { type: "string", required: true, minLength: 6, maxLength: 255, trim: false }
         }
      },
      login: {
         body: {
            username: { type: "string", required: true, minLength: 3, maxLength: 50 },
            password: { type: "string", required: true, minLength: 1, maxLength: 255, trim: false }
         }
      }
   },
   decisionModel: {
      create: {
         body: {
            name: { type: "string", required: true, minLength: 1, maxLength: 150 },
            descriptions: { type: "string", required: false, allowEmpty: true, maxLength: 5000 }
         }
      },
      update: {
         params: { id: positiveId },
         body: {
            name: { type: "string", required: false, minLength: 1, maxLength: 150 },
            descriptions: { type: "string", required: false, allowEmpty: true, maxLength: 5000 }
         }
      },
      idParam: {
         params: { id: positiveId }
      }
   },
   decisionModelMember: {
      create: {
         params: { decisionModelId: positiveId },
         body: {
            user_id: positiveId,
            role: { type: "enum", required: true, values: ["owner", "editor", "viewer"] }
         }
      },
      update: {
         params: { decisionModelId: positiveId, memberId: positiveId },
         body: {
            role: { type: "enum", required: true, values: ["owner", "editor", "viewer"] }
         }
      },
      remove: {
         params: { decisionModelId: positiveId, memberId: positiveId }
      },
      list: {
         params: { decisionModelId: positiveId }
      }
   },
   criteria: {
      create: {
         body: {
            decision_model_id: positiveId,
            code: { type: "string", required: false, minLength: 1, maxLength: 30 },
            name: { type: "string", required: true, minLength: 1, maxLength: 150 },
            type: { type: "enum", required: true, values: ["benefit", "cost"] },
            weight: { type: "number", required: true, min: 0, max: 1 }
         }
      },
      update: {
         params: { id: positiveId },
         body: {
            code: { type: "string", required: false, minLength: 1, maxLength: 30 },
            name: { type: "string", required: false, minLength: 1, maxLength: 150 },
            type: { type: "enum", required: false, values: ["benefit", "cost"] },
            weight: { type: "number", required: false, min: 0, max: 1 },
            status_active: { type: "boolean", required: false }
         }
      },
      byDecisionModel: {
         params: { decisionModelId: positiveId }
      },
      byId: {
         params: { id: positiveId }
      }
   },
   subCriteria: {
      create: {
         params: { criteriaId: positiveId },
         body: {
            criteria_id: { type: "integer", required: false, min: 1 },
            label: { type: "string", required: true, minLength: 1, maxLength: 150 },
            value: { type: "integer", required: true, min: 0 }
         }
      },
      update: {
         params: { id: positiveId },
         body: {
            label: { type: "string", required: false, minLength: 1, maxLength: 150 },
            value: { type: "integer", required: false, min: 0 }
         }
      },
      byCriteria: {
         params: { criteriaId: positiveId }
      },
      byId: {
         params: { id: positiveId }
      }
   },
   alternative: {
      create: {
         body: {
            decision_model_id: positiveId,
            name: { type: "string", required: true, minLength: 1, maxLength: 150 },
            description: { type: "string", required: false, allowEmpty: true, maxLength: 5000 }
         }
      },
      byDecisionModel: {
         params: { decisionModelId: positiveId }
      },
      byDecisionModelLegacy: {
         params: { decision_model_id: positiveId }
      },
      byId: {
         params: { id: positiveId }
      },
      update: {
         params: { id: positiveId },
         body: {
            name: { type: "string", required: false, minLength: 1, maxLength: 150 },
            description: { type: "string", required: false, allowEmpty: true, maxLength: 5000 }
         }
      }
   },
   evaluation: {
      create: {
         body: {
            alternative_id: positiveId,
            criteria_id: positiveId,
            sub_criteria_id: positiveId
         }
      },
      update: {
         params: { id: positiveId },
         body: {
            sub_criteria_id: positiveId
         }
      },
      byAlternative: {
         params: { alternativeId: positiveId }
      },
      byId: {
         params: { id: positiveId }
      }
   }
}
