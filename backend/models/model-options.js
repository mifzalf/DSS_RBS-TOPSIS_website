const buildModelOptions = (tableName, extraOptions = {}) => ({
   tableName,
   freezeTableName: true,
   timestamps: false,
   ...extraOptions
})

module.exports = {
   buildModelOptions
}
