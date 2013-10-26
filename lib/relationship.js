var _ = require('underscore')
  , inflect = require('inflect')
  , mongoose = require('mongoose')
  , ObjectId = mongoose.Schema.ObjectId

_.str = require('underscore.string');
_.mixin(_.str.exports());

module.exports = function Relationship(info) {
  var schema = info.schema
    , inflection = info.rules.iHaveMany ? inflect.pluralize : inflect.singularize
    , myPath = info.myPath || _.sprintf('_%s', inflection(info.modelName.toLowerCase()))

  function addPath() {
    var addition = {}
      , pathOptions = { type: ObjectId, ref: info.modelName }

    addition[myPath] = info.rules.iHaveMany ? [pathOptions] : pathOptions
    schema.add(addition)
  }

  function updateDependents(itsPath, updateOp) {
    return function(next) {
      var update = { }
      update[updateOp] = {}
      update[updateOp][itsPath] = this._doc._id

      var query = info.rules.iHaveMany
        ? {_id: { $in: this._doc[myPath] }}
        : {_id: this._doc[myPath]}

      info.instance.model(info.modelName).update(query, update, {multi: true}, next)
    }
  }

  function removeDependents() {
    return function(next) {
      var query = info.rules.iHaveMany
        ? {_id: { $in: this._doc[myPath] }}
        : {_id: this._doc[myPath]}

      info.instance.model(info.modelName).find(query, function(err, docs) {
        _.each(docs, function(d) {
          d.remove()
        })
      })

      next()
    }
  }


  addPath()
  this.enforceRelationshipWith = function(itsPath, options) {
    schema.post('save', updateDependents(itsPath, info.rules.itHasMany ? '$addToSet' : '$set'))

    schema.pre('remove', !info.rules.itHasMany && options && options.delete
               ? removeDependents()
               : updateDependents(itsPath, info.rules.itHasMany ? '$pull' : '$unset' ))
  }
}

