// 1. NORMALISASI MATRIX
const normalizeMatrix = (matrix) => {

   const rows = matrix.length
   const cols = matrix[0].length

   const divisor = []

   for(let j=0;j<cols;j++){

      let sum = 0

      for(let i=0;i<rows;i++){
         sum += Math.pow(matrix[i][j],2)
      }

      divisor[j] = Math.sqrt(sum)
   }

   const normalized = matrix.map(row =>
      row.map((value,j)=> value/divisor[j])
   )

   return normalized
}


// 2. WEIGHTED MATRIX
const weightedMatrix = (normalized, weights) => {

   return normalized.map(row =>
      row.map((value,j)=> value * weights[j])
   )

}


// 3. IDEAL POSITIVE & NEGATIVE
const idealSolution = (weighted, types) => {

   const cols = weighted[0].length

   const positive = []
   const negative = []

   for(let j=0;j<cols;j++){

      const column = weighted.map(row=>row[j])

      if(types[j] === "benefit"){

         positive[j] = Math.max(...column)
         negative[j] = Math.min(...column)

      }else{

         positive[j] = Math.min(...column)
         negative[j] = Math.max(...column)

      }

   }

   return {positive,negative}
}


// 4. DISTANCE CALCULATION
const distance = (weighted, ideal) => {

   const positiveDistance = []
   const negativeDistance = []

   for(let i=0;i<weighted.length;i++){

      let pos = 0
      let neg = 0

      for(let j=0;j<weighted[i].length;j++){

         pos += Math.pow(weighted[i][j] - ideal.positive[j],2)
         neg += Math.pow(weighted[i][j] - ideal.negative[j],2)

      }

      positiveDistance[i] = Math.sqrt(pos)
      negativeDistance[i] = Math.sqrt(neg)

   }

   return {positiveDistance,negativeDistance}
}


// 5. PREFERENCE SCORE
const preference = (distance)=>{

   const scores = []

   for(let i=0;i<distance.positiveDistance.length;i++){

      const dPlus = distance.positiveDistance[i]
      const dMinus = distance.negativeDistance[i]

      scores[i] = dMinus / (dPlus + dMinus)

   }

   return scores
}


// 6. RANKING
const ranking = (scores)=>{

   return scores
      .map((score,index)=>({alternative:index,score}))
      .sort((a,b)=> b.score - a.score)
      .map((item,i)=>({
         alternative:item.alternative,
         score:item.score,
         rank:i+1
      }))

}


// 7. FUNGSI UTAMA TOPSIS
exports.calculateTopsis = (matrix, criteria)=>{

   const weights = criteria.map(c=>c.weight)
   const types = criteria.map(c=>c.type)

   const normalized = normalizeMatrix(matrix)

   const weighted = weightedMatrix(normalized,weights)

   const ideal = idealSolution(weighted,types)

   const dist = distance(weighted,ideal)

   const scores = preference(dist)

   const result = ranking(scores)

   return result

}