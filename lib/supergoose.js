var _ = require('underscore')
  , mongoose = require('mongoose')
  , ObjectId = mongoose.Schema.ObjectId
_.str = require('underscore.string');
_.mixin(_.str.exports());

module.exports = exports = function superGoosePlugin(schema, options) {
  if(options)  {
    var messages = options.messages
    var instance = options.instance
  }

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

  schema.statics.findOrCreate = function findOrCreate(conditions, doc, options, callback) {
    if (arguments.length < 4) {
      if (_.isFunction(options)) {
        // Scenario: findOrCreate(conditions, doc, callback)
        callback = options;
        options = {};
      } else if (_.isFunction(doc)) {
        // Scenario: findOrCreate(conditions, callback);
        callback = doc;
        doc = {};
        options = {};
      }
    }
    var self = this;
    doc = _(doc).reduce(function(memo, v, k) {
      memo[k] = v && v.toJSON ? v.toJSON() : v
      return memo
    }, {})

    this.findOne(conditions, function(err, result) {
      if(err || result) {
        if(options && options.upsert && !err) {
          self.update(conditions, doc, function(err, count){
            self.findOne(conditions, callback);
          })
        } else {
          callback(err, result)
        }
      } else {
        self.create(_.extend(conditions, doc), callback)
      }
    })
  }

  schema.statics.errors = function errors(errors, callback) {
    errors = _.toArray(errors.errors)
    errors = _.map(errors, function(error) {
       return _.sprintf(messages[error.type], error.path)
    })
    callback(errors)
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
