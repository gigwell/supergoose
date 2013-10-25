var _ = require('underscore')
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

  schema.parentOf = function(modelName, fieldName, options) {
    var pathName = _.sprintf('_%ss', modelName.toLowerCase())
    options = _.extend({delete: false, path: pathName}, options)

    addPathTo(options.path, [{type: ObjectId, ref: modelName}])
    schema.post('save', updateDependents(modelName, fieldName, options.path, '$set'))
    schema.pre('remove', options.delete
               ? removeDependents(modelName, options.path)
               : updateDependents(modelName, fieldName, options.path, '$unset'))
  }

  schema.childOf = function(modelName, fieldName, options) {
    var pathName = _.sprintf('_%s', modelName.toLowerCase())
    options = _.extend({path: pathName}, options)

    addPathTo(options.path, {type: ObjectId, ref: modelName})
    schema.post('save', updateDependents(modelName, fieldName, options.path, '$addToSet'))
    schema.pre('remove', updateDependents(modelName, fieldName, options.path, '$pull'))
  }
}
