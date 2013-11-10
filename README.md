supergoose [![Build Status](https://travis-ci.org/jamplify/supergoose.png)](https://travis-ci.org/jamplify/supergoose)
==================

[Mongoose](https://github.com/LearnBoost/mongoose) simple plugin adding some
handy functions.

## Model functions

* [findOrCreate](#findOrCreate)
* [errors](#errors)

## Relationship creator functions

* [parentOf](#relFunction)
* [childOf](#relFunction)
* [hasA](#relFunction)
* [hasMany](#relFunction)
* [Relationship](#relationship)

Installation
------------

`npm install supergoose`

Usage
-----

### Initialization
Use mongoose's plugin method to extend your models with supergoose

```javascript
var supergoose = require('supergoose')
var ClickSchema = new Schema({ ... });
ClickSchema.plugin(supergoose, [options]);
var Click = mongoose.model('Click', ClickSchema)
```

__Arguments__
* supergoose <Object> - The supergoose function
* options <Object> - Options object

__Valid Options__
* instance <Object> - The instance of mongoose used in the application (Required for Schema functions)
* messages <Object> - Object of custom messages (Required for errors function)

---------------------------------------

<a name="findOrCreate" />
### findOrCreate()

Adds find or create functionality to mongoose models. This is handy
for libraries like passport.js which require it

```javascript
Click.findOrCreate({ip: '127.0.0.1'}, function(err, doc) {});
Click.findOrCreate({ip: '127.0.0.1'}, {browser: 'Chrome'}, function(err, click) {})
```

__Arguments__
* query <Object> - Conditions with which to search for document
* [doc] <Object> - Document to insert if document not found
* [options] <Object>
* callback <Function>

__Valid Options__
* upsert <bool> - updates the object if it exists. Default: false

---------------------------------------

<a name="errors" />
### errors

Parses the complex validation errors return from mongoose into a simple
array of messages to be displayed as flash messages or something similar

```javascript
var supergoose = require('supergoose')
var ClickSchema = new Schema({ip: {type: String, required: true}});
Click.plugin(supergoose, {messages: {'required': '%s is a required field'}});
var Click = mongoose.model('Click', ClickSchema);
```

The Click model now has an errors static method

```javascript
Click.create({}, function(err, click) {
  if(err) {
    Click.errors(err, function(messages) {
      console.log(messages);
      // outputs ['ip is a required field']
    })
  }
});
```
__Arguments__
* errors <Error> - error returned from mongoose command
* callback <Function>

---------------------------------------

<a name="relFunction" />
### Relationship Creator Functions

* parentOf - Creates a one to many relationship
* childOf - Creates a many to one relationship
* hasA - Creates a one to one relationship
* hasMany - Creates a many to many relationship

__Arguments__
* modelName <String> - Name of related Model
* [myPath] <String> - Name of path on this schema that refers to related Model. (If not provided, a default is used based on the model name. '_clicks' for the above example)

__Returns__
* Relationship

---------------------------------------

<a name="relationship" />
### Relationship

When a relationship is created, it adds a path that refers to the related model on the schema that creates it.
The relationship object has one property:

#### enforceWith

```javascript
var supergoose = require('supergoose')
var mongoose = require('mongoose')

var ClickSchema = new Schema({ip: {type: String, required: true}, _user: {type: ObjectId}});
var UserSchema = new Schema({name: String})

UserSchema.plugin(supergoose, {instance: mongoose});
UserSchema.parentOf('Click', 'clickCollection').enforceWith('_user')

```

__Arguments__
* itsPath <String> - Name of path on related model that refers back to this schema.
* [options] <Object>

__Valid Options__
* delete <bool> - Default: false. Only affects one to X relationships. If set to true, when a doc is removed, it will delete related docs.


License
-------

MIT License
