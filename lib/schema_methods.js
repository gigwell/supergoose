var Relationship = require('./relationship')

module.exports = function(schema, instance) {

  schema.parentOf = schema.oneToMany = function(modelName, pathName) {
    var relInfo = {
      schema: schema,
      instance: instance,
      modelName: modelName,
      myPath: pathName,
      rules: { iHaveMany: true }
    }

    return new Relationship(relInfo)
  }

  schema.childOf = schema.manyToOne = function(modelName, pathName) {
    var relInfo = {
      schema: schema,
      instance: instance,
      modelName: modelName,
      myPath: pathName,
      rules: { itHasMany: true }
    }
    return new Relationship(relInfo)
  }

  schema.hasA = schema.oneToOne = function(modelName, pathName) {
    var relInfo = {
      schema: schema,
      instance: instance,
      modelName: modelName,
      myPath: pathName,
      rules: {}
    }
    return new Relationship(relInfo)
  }

  schema.hasMany = schema.manyToMany = function(modelName, pathName) {
    var relInfo = {
      schema: schema,
      instance: instance,
      modelName: modelName,
      myPath: pathName,
      rules: { iHaveMany: true, itHasMany: true }
    }
    return new Relationship(relInfo)
  }
}
