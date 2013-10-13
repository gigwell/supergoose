supergoose
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
Click.plugin(supergoose, [options]);
```

__Arguments__
* supergoose <Object> - The supergoose function
* options <Object> - Options object

__Valid Options__
* instance <Object> - The instance of mongoose used in the application (Required for Schema functions)
* messages <Object> - Object of custom messages (Required for errors function)

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

### parentOf
<a name="parentOf" />

Enforces parent relationship on a child object. When called, a path on the schema will be added that references the child model. On save, any model instantiated with this schema will add its id to their children. On remove, the model with orphan its children.

```javascript
var supergoose = require('supergoose')
var mongoose = require('mongoose')

var ClickSchema = new Schema({ip: {type: String, required: true}, _user: {type: ObjectId}});
var UserSchema = new Schema({name: String})

UserSchema.plugin(supergoose, {instance: mongoose});
UserSchema.parentOf('Click', '_user')

var Click = mongoose.model('Click', ClickSchema);
var User = mongoose.model('User', UserSchema);

```
The User model now has a '_clicks' field that is an array of ObjectIds that references the Click model.

__Arguments__
* modelName <String> - Name of child Model
* fieldName <String> - Name of path on child Model that refers to parent
* [options] <Object>

__Valid Options__
* delete <bool> - If set, child models will be deleted rather than orphaned on remove. Default: false
* path <String> - Alternate pathName for child on parent model. Default: _<modelName>s


### childOf
<a name="childOf" />

Enforces child relationship on a parent object. When called, a path on the schema will be added that references the parent model. On save, any model instantiated with this schema will add its id to its parent's collection. On remove, the model with remove its id from its parent's collection.

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

The Click model now has a '_user' field that is an ObjectId that references the User model.

__Arguments__
* modelName <String> - Name of parent Model
* fieldName <String> - Name of path on user Model that refers to parent
* [options] <Object>

__Valid Options__
* path <String> - Alternate pathName for parent on child model. Default: _<modelName>

### errors
<a name="errors" />

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
