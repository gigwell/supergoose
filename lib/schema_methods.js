var _ = require('underscore')
  , inflect = require('inflect')
  , mongoose = require('mongoose')
  , ObjectId = mongoose.Schema.ObjectId

_.str = require('underscore.string');
_.mixin(_.str.exports());

module.exports = function(schema, instance) {
  function addPathTo(modelName, pathOptions) {
    var addition = {}
    addition[modelName] = pathOptions
    schema.add(addition)
  }

  function updateDependents(modelName, fieldName, pathName, updateOp) {
    return function(next) {
      var update = { }
      update[updateOp] = {}
      update[updateOp][fieldName] = this._doc._id

      var query = _.isArray(this._doc[pathName])
        ? {_id: { $in: this._doc[pathName] }}
        : {_id: this._doc[pathName]}

      instance.model(modelName).update(query, update, {multi: true}, next)
    }
  }

  function removeDependents(modelName, pathName) {
    return function(next) {
      var query = _.isArray(this._doc[pathName])
        ? {_id: { $in: this._doc[pathName] }}
        : {_id: this._doc[pathName]}

      instance.model(modelName).find(query, function(err, docs) {
        _.each(docs, function(d) {
          d.remove()
        })
      })

      next()
    }
  }

  function Relationship(modelName, myPath, rules) {
    var pathDescription = { type: ObjectId, ref: modelName }
      , inflection = rules.iHaveMany ? inflect.pluralize : inflect.singularize

    myPath = myPath || _.sprintf('_%s', inflection(modelName.toLowerCase()))
    addPathTo(myPath, rules.iHaveMany ? [pathDescription] : pathDescription)

    this.enforceRelationshipWith = function(itsPath, options) {
      schema.post('save', updateDependents(modelName,
                                           itsPath,
                                           myPath,
                                           rules.itHasMany ? '$addToSet' : '$set'))

      schema.pre('remove', options && options.delete
                 ? removeDependents(modelName, myPath)
                 : updateDependents(modelName,
                                    itsPath,
                                    myPath,
                                    rules.itHasMany ? '$pull' : '$unset' ))
    }
  }

  schema.parentOf = function(modelName, pathName) {
    var rules = { iHaveMany: true }
    return new Relationship(modelName, pathName, rules)
  }

  schema.childOf = function(modelName, pathName) {
    var rules = { itHasMany: true }
    return new Relationship(modelName, pathName, rules)
  }
}
