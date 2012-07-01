
/**
 * @class supergoose
 * @method superGoodsePlugin
 **/

module.exports = exports = function superGoosePlugin(schema, options) {
  if (options) {
    var messages = options.message;
  }; 
  // @method findOrCreate
  schema.statics.findOrCreate = function findOrCreate(object, callback) {
    var self = this;
    self.findOne(object, function(error, result) {
      if (error || result) {
        callback(error, result)
      } else {
        var obj = new self(object);
        obj.save(function(_error) {
          callback(_error, obj)
        });
      }
    });
  };
  // handle mongoose errors
  schema.statics.errors = function errors(_errors, callback) {
    var messages = [];
    for (var index in _errors['errors']) {
      var item = _errors['errors'][index];
      messages.push(item.path + ' is ' + item.type);
    };
    callback(messages);
  };
};

/* EOF */