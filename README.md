supergoose
==================

[Mongoose](https://github.com/LearnBoost/mongoose) simple plugin adding some
handy functions.

```javasript
/* Adds find or create functionality to mongoose models. This is handy
 * for libraries like passport.js which require it
 */
Model.findOrCreate()

/* Parses the complex validation errors return from mongoose into a simple
 * array of messages to be displayed as flash messages or something similar
 */
Model.errors()
```

Installation
------------

`npm install supergoose`

Usage
-----

### findOrCreate

```javascript
var supergoose = require('supergoose')
var ClickSchema = new Schema({ ... });
Click.plugin(supergoose);
var Click = mongoose.model('Click', ClickSchema);
```

The Click model now has a findOrCreate static method

```javascript
Click.findOrCreate({ip: '127.0.0.1'}, function(err, click) {
  console.log('A new click from "%s" was inserted', click.ip);
  Click.findOrCreate({}, function(err, click) {
    console.log('Did not create a new click for "%s"', click.ip);
  })
});
```

You can also include properties that aren't used in the
find call, but will be added to the object if it is created.

```javascript
Click.create({ip: '127.0.0.1'}, {browser: 'Mozilla'}, function(err, val) {
  Click.findOrCreate({ip: '127.0.0.1'}, {browser: 'Chrome'}, function(err, click) {
    console.log('A click from "%s" using "%s" was found', click.ip, click.browser);
    // prints A click from "127.0.0.1" using "Mozilla" was found
  })
});
```
### parentOf
```javascript
var supergoose = require('supergoose')
var mongoose = require('mongoose')

var ClickSchema = new Schema({ip: {type: String, required: true}, _user: {type: ObjectId}});
var UserSchema = new Schema({name: String})

UserSchema.plugin(supergoose, {instance: mongoose});
UserSchema.parentOf('Click', '_user')

var Click = mongoose.model('Click', ClickSchema);
var User = mongoose.model('Click', ClickSchema);

```

The User model now has a '_clicks' field that is an array of ObjectIds that references the Click model.

It will enforce the relationship by setting the _user field on any clicks in a User's array on save and unsetting the field on remove

ParentOf also takes an optional object to change the name of the created path and to mark children for deletion rather than orphanage on remove

### childOf
```javascript
var supergoose = require('supergoose')
var mongoose = require('mongoose')

var ClickSchema = new Schema({ip: {type: String, required: true});
var UserSchema = new Schema({name: String, _clicks: [{type: ObjectId}]})

ClickSchema.plugin(supergoose, {instance: mongoose});
ClickSchema.parentOf('User', '_clicks')

var Click = mongoose.model('Click', ClickSchema);
var User = mongoose.model('Click', ClickSchema);

```

The Click model now has a '_user' field that is an array of ObjectIds that references the USer model.

It will enforce the relationship by pushing an id to the _clicks field on any user on save and pulling the id on remove

ChildOf also takes an optional object to change the name of the created path

### errors
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
License
-------

MIT License
