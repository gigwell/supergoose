var _ = require('underscore')
  , mongoose = require('mongoose')
  , ObjectId = mongoose.Schema.ObjectId
_.str = require('underscore.string');
_.mixin(_.str.exports());

module.exports = exports = function superGoosePlugin(schema, options) {
  if(options) var messages = options.messages

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

  schema.hasMany = function(modelName, fieldName) {
    var addition = {}
      , pathName = _.sprintf('_%ss', modelName.toLowerCase())

    addition[pathName] = [{type: ObjectId, ref: modelName}]
    schema.add(addition)

    schema.pre('save', function(next) {
      var query = {_id: {$in: this._doc[pathName]}}
        , update = { $set: {} }
      update.$set[fieldName] = this._doc._id
      mongoose.model(modelName).update(query, update, {multi: true}, next)
    })
  }
}
