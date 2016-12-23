var _ = require('underscore')
  , inflect = require('inflect')
  , mongoose = require('mongoose')
  , ObjectId = mongoose.Schema.ObjectId
  , async = require('async')

_.str = require('underscore.string');
_.mixin(_.str.exports());

module.exports = function Relationship(info) {
  var schema = info.schema,
      inflection = info.rules.iHaveMany ? inflect.pluralize : inflect.singularize,
      myPath = info.myPath || _.sprintf('_%s', inflection(info.modelName.toLowerCase())),
      updateOp = info.rules.itHasMany ? '$addToSet' : '$set',
      removeOp = info.rules.itHasMany ? '$pull' : '$unset'

  function addPath() {
    var addition = {}
      , pathOptions = { type: ObjectId, ref: info.modelName }

    addition[myPath] = info.rules.iHaveMany ? [pathOptions] : pathOptions
    schema.add(addition)
  }

  function updateDependents(itsPath, alwaysRemove) {
    return function(_doc, _next) {
      var next = _.isFunction(_doc) ? _doc : _next;
      var doc = !_.isFunction(_doc) ? _doc : this._doc;
      
      var update = { }
      update[updateOp] = {}
      update[updateOp][itsPath] = doc._id

      var remove = { }
      remove[removeOp] = {}
      remove[removeOp][itsPath] = doc._id

      var query = info.rules.iHaveMany
        ? {_id: { $in: doc[myPath] }}
        : {_id: doc[myPath]}


      async.parallel([
        function(onward) {
          info.instance.model(info.modelName).update(query, update, {multi: true}, onward)
        }, function(onward) {
          if (!alwaysRemove && !info.rules.iHaveMany) return onward()

          var orphans = {_id: { $nin: doc[myPath] } }
          orphans[itsPath] = doc._id
          info.instance.model(info.modelName).update(orphans, remove, {multi: true}, onward)
        }.bind(this)
      ], function(err, res) {
        if (_.isFunction(next)) next(err);
      })
    }
  }

  function removeDependents(itsPath, isHardDelete) {
    isHardDelete = isHardDelete && !info.rules.itHasMany

    return function(next) {
      var remove = { }
      remove[removeOp] = {}
      remove[removeOp][itsPath] = this._doc._id

      var query = info.rules.iHaveMany
        ? {_id: { $in: this._doc[myPath] }}
        : {_id: this._doc[myPath]}

      if (isHardDelete) {
        info.instance.model(info.modelName).find(query, function(err, docs) {
          _.each(docs, function(d) {
            d.remove()
          })
          next()
        })
      } else {
        info.instance.model(info.modelName).update(query, remove, {multi: true},
        function(err, res) {
          if (_.isFunction(next)) next(err, res);
        })
      }
    }
  }


  addPath()
  this.enforceWith = function(itsPath, options) {
    schema.post('save', updateDependents(itsPath))
    schema.post('findOneAndUpdate', updateDependents(itsPath, true))
    schema.pre('remove', removeDependents(itsPath, options && options.delete))
  }
}
