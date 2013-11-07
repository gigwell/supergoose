var Relationship = require('./relationship')

module.exports = function(schema, instance) {

  schema.parentOf = function(modelName, pathName) {
    var relInfo = {
      schema: schema,
      instance: instance,
      modelName: modelName,
      myPath: pathName,
      rules: { iHaveMany: true }
    }

    return new Relationship(relInfo)
  }

  schema.childOf = function(modelName, pathName) {
    var relInfo = {
      schema: schema,
      instance: instance,
      modelName: modelName,
      myPath: pathName,
      rules: { itHasMany: true }
    }
    return new Relationship(relInfo)
  }

  schema.hasA = function(modelName, pathName) {
    var relInfo = {
      schema: schema,
      instance: instance,
      modelName: modelName,
      myPath: pathName,
      rules: {}
    }
    return new Relationship(relInfo)
  }

  schema.hasMany = function(modelName, pathName) {
    var relInfo = {
      schema: schema,
      instance: instance,
      modelName: modelName,
      myPath: pathName,
      rules: { iHaveMany: true, itHasMany: true }
    }
    return new Relationship(relInfo)
  }

  schema.createRelationship = function(modelName, pathName, rules) {
    var relInfo = {
      schema: schema,
      instance: instance,
      modelName: modelName,
      myPath: pathName,
      rules: rules || {}
    }

    return new Relationship(relInfo)
  }
}
