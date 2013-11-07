var _ = require('underscore')
  , addModelMethods = require('./model_methods.js')
  , addSchemaMethods = require('./schema_methods.js')

module.exports = exports = function superGoosePlugin(schema, options) {
  options = _.extend({messages: {}, instance: null}, options)
  addModelMethods(schema, options.messages)
  addSchemaMethods(schema, options.instance)

  /**
   * Transform methods for protected fields
   */
  if(options.protect){
    if (!schema.options.toObject) schema.options.toObject = {}
    schema.options.toObject.transform = function(doc, ret, options) {
      if(typeof doc.ownerDocument !== 'function') {
        if (doc.schema !== schema)
          return doc.toObject();
        var fields = options.protectedFields
              ? options.protectedFields.split(' ') : []
        fields.forEach(function(prop) {
          delete ret[prop];
        })
      }
    }

    if (!schema.options.toJSON) schema.options.toJSON = {}
    schema.options.toJSON.transform = function(doc, ret, options) {
      if(typeof doc.ownerDocument !== 'function') {
        if (doc.schema !== schema)
          return doc.toJSON();
        var fields = options.protectedFields
              ? options.protectedFields.split(' ') : []
        fields.forEach(function(prop) {
          delete ret[prop];
        })
      }
    }
  }
}
