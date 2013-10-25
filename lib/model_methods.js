var _ = require('underscore')
_.str = require('underscore.string');
_.mixin(_.str.exports());

module.exports = function(schema, messages) {
  schema.statics.findOrCreate = function findOrCreate(conditions, doc, options, callback) {
    function cbCreated(err, results) { callback(err, results, true) }
    function cbFound(err, results) { callback(err, results, false) }

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
            self.findOne(conditions, cbFound)
          })
        } else { cbFound(err, result) }
      } else { self.create(_.extend(conditions, doc), cbCreated) }
    })
  }

  schema.statics.errors = function errors(errors, callback) {
    errors = _.toArray(errors.errors)
    errors = _.map(errors, function(error) {
       return _.sprintf(messages[error.type], error.path)
    })
    callback(errors)
  }

}

