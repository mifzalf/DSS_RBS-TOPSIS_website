const normalizeMatrix = (matrix) => {
   const rows = matrix.length
   const cols = matrix[0].length

   const divisor = []

   for (let j = 0; j < cols; j++) {
      let sum = 0

      for (let i = 0; i < rows; i++) {
         sum += Math.pow(matrix[i][j], 2)
       }

       divisor[j] = Math.sqrt(sum)
    }

    const normalized = matrix.map(row =>
      row.map((value, j) => (divisor[j] === 0 ? 0 : value / divisor[j]))
    )

    return normalized
}

const weightedMatrix = (normalized, weights) => {
   return normalized.map(row =>
      row.map((value, j) => value * weights[j])
    )
}

const idealSolution = (weighted, types) => {
   const cols = weighted[0].length

   const positive = []
   const negative = []

   for (let j = 0; j < cols; j++) {
      const column = weighted.map(row => row[j])

      if (types[j] === "benefit") {
         positive[j] = Math.max(...column)
         negative[j] = Math.min(...column)
      } else {
         positive[j] = Math.min(...column)
         negative[j] = Math.max(...column)
      }
   }

   return { positive, negative }
}

const distance = (weighted, ideal) => {
   const positiveDistance = []
   const negativeDistance = []

   for (let i = 0; i < weighted.length; i++) {
      let pos = 0
      let neg = 0

      for (let j = 0; j < weighted[i].length; j++) {
         pos += Math.pow(weighted[i][j] - ideal.positive[j], 2)
         neg += Math.pow(weighted[i][j] - ideal.negative[j], 2)
      }

      positiveDistance[i] = Math.sqrt(pos)
      negativeDistance[i] = Math.sqrt(neg)

   }

   return { positiveDistance, negativeDistance }
}

const preference = (distance) => {
   const scores = []

   for (let i = 0; i < distance.positiveDistance.length; i++) {
      const dPlus = distance.positiveDistance[i]
      const dMinus = distance.negativeDistance[i]

      const denominator = dPlus + dMinus
      scores[i] = denominator === 0 ? 0 : dMinus / denominator
   }

   return scores
}

const ranking = (scores) => {
   return scores
      .map((score, index) => ({ alternative: index, score }))
      .sort((a, b) => b.score - a.score)
      .map((item, i) => ({
         alternative: item.alternative,
         score: item.score,
         rank: i + 1
       }))
}

exports.calculateTopsis = (matrix, criteria) => {
   if (!Array.isArray(criteria) || criteria.length === 0) {
      return []
   }

   if (!Array.isArray(matrix) || matrix.length === 0) {
      return []
   }

   if (!Array.isArray(matrix[0]) || matrix[0].length === 0) {
      return []
   }

   const expectedColumnCount = criteria.length
   const hasInvalidMatrixShape = matrix.some(row => !Array.isArray(row) || row.length !== expectedColumnCount)

   if (hasInvalidMatrixShape) {
      throw new Error("Invalid TOPSIS matrix")
   }

   const weights = criteria.map(c => Number(c.weight || 0))
   const types = criteria.map(c => c.type)

   const normalized = normalizeMatrix(matrix)
   const weighted = weightedMatrix(normalized, weights)
   const ideal = idealSolution(weighted, types)
   const dist = distance(weighted,ideal)
   const scores = preference(dist)
   const result = ranking(scores)
   return result
}
