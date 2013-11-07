supergoose [![Build Status](https://travis-ci.org/jamplify/supergoose.png)](https://travis-ci.org/jamplify/supergoose)
==================

[Mongoose](https://github.com/LearnBoost/mongoose) simple plugin adding some
handy functions.

## Model functions

* [findOrCreate](#findOrCreate)
* [errors](#errors)

## Schema functions

* [parentOf](#parentOf)
* [childOf](#childOf)

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

<a name="parentOf" />
### parentOf

Creates a one-to-many Relationship

```javascript
var supergoose = require('supergoose')
var mongoose = require('mongoose')

var ClickSchema = new Schema({ip: {type: String, required: true}, _user: {type: ObjectId}});
var UserSchema = new Schema({name: String})

UserSchema.plugin(supergoose, {instance: mongoose});
var Relationship = UserSchema.parentOf('Click', '_user')

```

__Arguments__
* modelName <String> - Name of child Model
* [myPath] <String> - Name of schema path

__Returns__
* Relationship

---------------------------------------

<a name="childOf" />
### childOf

Creates a many-to-one relationship

```javascript
var supergoose = require('supergoose')
var mongoose = require('mongoose')

var ClickSchema = new Schema({ip: {type: String, required: true});
var UserSchema = new Schema({name: String, _clicks: [{type: ObjectId}]})

ClickSchema.plugin(supergoose, {instance: mongoose});
ClickSchema.childOf('User', '_clicks')

var Click = mongoose.model('Click', ClickSchema);
var User = mongoose.model('User', UserSchema);

```

__Arguments__
* modelName <String> - Name of child Model
* [myPath] <String> - Name of schema path

__Returns__
* Relationship

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

License
-------

MIT License
