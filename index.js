var _ = require('underscore')
  , mongoose = require('mongoose')
  , ObjectId = mongoose.Schema.ObjectId
_.str = require('underscore.string');
_.mixin(_.str.exports());

module.exports = exports = function superGoosePlugin(schema, options) {
  if(options) var messages = options.messages

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

      mongoose.model(modelName).update(query, update, {multi: true}, next)
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

  schema.parentOf = function(modelName, fieldName) {
    var pathName = _.sprintf('_%ss', modelName.toLowerCase())

    addPathTo(pathName, [{type: ObjectId, ref: modelName}])
    schema.post('save', updateDependents(modelName, fieldName, pathName, '$set'))
    schema.pre('remove', updateDependents(modelName, fieldName, pathName, '$unset'))
  }

  schema.childOf = function(modelName, fieldName) {
    var pathName = _.sprintf('_%s', modelName.toLowerCase())

    addPathTo(pathName, {type: ObjectId, ref: modelName})
    schema.post('save', updateDependents(modelName, fieldName, pathName, '$addToSet'))
    schema.pre('remove', updateDependents(modelName, fieldName, pathName, '$pull'))
  }
}
