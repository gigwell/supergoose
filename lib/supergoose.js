var _ = require('underscore')
  , addModelMethods = require('./model_methods.js')
  , addSchemaMethods = require('./schema_methods.js')

module.exports = exports = function superGoosePlugin(schema, options) {
  options = _.extend({messages: {}, instance: null}, options)
  addModelMethods(schema, options.messages)
  addSchemaMethods(schema, options.instance)
}
