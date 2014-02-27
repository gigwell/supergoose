/**
  * Dependencies
  */

var mocha = require('mocha')
  , should = require('should')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , supergoose = require('../lib/supergoose.js')

mongoose.connect('mongodb://localhost/supergoose')
mongoose.connection.on('error', function (err) {
  console.error('MongoDB error: ' + err.message);
  console.error('Make sure a mongoDB server is running and accessible by this application')
});

var ReferrerSchema = new Schema({
    name: String
  , address: String
})

var ClickSchema = new Schema({
    ip : {type: String, required: true}
  , OS: String
  , browser: String
  , referrer: {
    name: String
  }
})

var OtherSchema = new Schema({field: String, _click: {type: Schema.ObjectId, ref: 'Click'}})

var messages =  {
  'required': "%s is required"
}

ClickSchema.plugin(supergoose, {messages: messages, instance: mongoose});
ReferrerSchema.plugin(supergoose, {instance: mongoose});

var Click = mongoose.model('Click', ClickSchema);
var Referrer = mongoose.model('Referrer', ReferrerSchema);
var Other = mongoose.model('Other', OtherSchema);

afterEach(function(done) {
  Click.remove(function(err) {
    Referrer.remove(function() {
      Other.remove(done)
    })
  })
})

describe('findOrCreate', function() {
  it("should create the obeject if it doesn't exist", function(done) {
    Click.findOrCreate({ip: '127.0.0.1'}, function(err, click) {
      click.ip.should.eql('127.0.0.1')
      Click.count({}, function(err, num) {
        num.should.equal(1)
        done();
      })
    })
  })

  it("returns the object if it already exists", function(done) {
    Click.create({ip: '127.0.0.1'}, function(err, val) {
      Click.findOrCreate({ip: '127.0.0.1'}, function(err, click) {
        click.ip.should.eql('127.0.0.1')
        Click.count({}, function(err, num) {
          num.should.equal(1)
          done();
        })
      })
    })
  })

  it("should notify when object was created", function(done) {
    Click.findOrCreate({ip: '127.0.0.1'}, function(err, click, created) {
      created.should.eql(true)
      done()
    })
  })

  it("it should notify if the object was found", function(done) {
    Click.create({ip: '127.0.0.1'}, function(err, val) {
      Click.findOrCreate({ip: '127.0.0.1'}, function(err, click, created) {
        created.should.eql(false)
        done();
      })
    })
  })

  describe('with extra properties', function() {
    it("extends the object with additional properties", function(done) {
      Click.findOrCreate({ip: '127.0.0.1'}, {browser: 'Mozilla'}, function(err, click) {
        click.should.have.property('ip', '127.0.0.1')
        click.should.have.property('browser', 'Mozilla')
        done();
      })
    })

    it("finds the object without extra params", function(done) {
      Click.create({ip: '127.0.0.1', browser: 'Chrome'}, function(err, val) {
        Click.findOrCreate({ip: '127.0.0.1'}, {browser: 'IE'}, function(err, click) {
          click.should.have.property('browser', 'Chrome')
          done();
        })
      })
    })

    it("allows mongoose objects as extra properties", function(done) {
      Referrer.create({name: 'Carmen Sandiego', address: 'Unknown'}, function(err, referrer) {
        Click.findOrCreate({ip: '127.0.0.1'}, { referrer: referrer }, function(err, click) {
          click.referrer.should.have.property('name', 'Carmen Sandiego')
          should.not.exist(click.referrer.address)
          done()
        })
      })
    })
  })

  describe('with upsert', function() {
    it("updates the existing object", function(done) {
      Click.create({ip: '127.0.0.1', browser: 'Chrome'}, function(err, val) {
        Click.findOrCreate({ip: '127.0.0.1'}, {browser: 'IE'}, {upsert: true}, function(err, click) {
          click.should.have.property('browser', 'IE')
          Click.count({}, function(err, num) {
            num.should.equal(1)
            done();
          })
        })
      })
    })

    it("adds new properties to an existing object", function(done) {
      Click.create({ip: '127.0.0.1', browser: 'Chrome'}, function(err, val) {
        Click.findOrCreate({ip: '127.0.0.1'}, {browser: 'IE', OS: 'Ubuntu'}, {upsert: true}, function(err, click) {
          click.should.have.property('browser', 'IE')
          click.should.have.property('OS', 'Ubuntu')
          Click.count({}, function(err, num) {
            num.should.equal(1)
            done();
          })
        })
      })
    })

    it("notifies that there was no creation", function(done) {
      Click.create({ip: '127.0.0.1', browser: 'Chrome'}, function(err, val) {
        Click.findOrCreate({ip: '127.0.0.1'}, {browser: 'IE'}, {upsert: true}, function(err, click, created) {
          created.should.equal(false)
          done();
        })
      })
    })
  })
})

describe('parentOf', function() {
  it('should add ref property to Schema', function() {
    ReferrerSchema.parentOf('Click')
    var path = ReferrerSchema.path('_clicks')

    should.exist(path)
    path.caster.instance.should.eql('ObjectID')
    path.caster.options.ref.should.eql('Click')
  })

  it('should allow for custom paths', function() {
    ReferrerSchema.oneToMany('Click', '_funsos')
    var path = ReferrerSchema.path('_funsos')

    should.exist(path)
    path.caster.instance.should.eql('ObjectID')
    path.caster.options.ref.should.eql('Click')
  })

  it('should add a reference to the object id on save', function(done) {
    ClickSchema.add({_referrer: { type: Schema.ObjectId, ref: 'Referrer' }})
    ReferrerSchema.parentOf('Click').enforceWith('_referrer')
    var Click = mongoose.model('Click', ClickSchema);
    var Referrer = mongoose.model('Referrer', ReferrerSchema);

    Click.create({ip: '1234'}, function(err, click) {
      Referrer.create({name: 'hello', _clicks: [click._id]}, function(err, referrer) {
        Click.findById(click._id, function(err, click) {
          click._doc._referrer.should.eql(referrer._id)
          done()
        })
      })
    })
  })

  it('should remove reference to the object id on remove', function(done) {
    ClickSchema.add({_referrer: { type: Schema.ObjectId, ref: 'Referrer' }})
    ReferrerSchema.parentOf('Click').enforceWith('_referrer')
    var Click = mongoose.model('Click', ClickSchema);
    var Referrer = mongoose.model('Referrer', ReferrerSchema);
    var id = new mongoose.Types.ObjectId()

    Referrer.create({name: 'hello', _clicks: [id]}, function(err, referrer) {
      Click.create({_id: id, ip: '1234', _referrer: referrer._doc._id }, function(err) {
        referrer.remove(function(err) {
          Click.findById(id, function(err, click) {
            should.not.exist(click._doc._referrer)
            done()
          })
        })
      })
    })
  })

  it('removes parent reference on child object when it is removed from array', function(done) {
    ClickSchema.add({_referrer: { type: Schema.ObjectId, ref: 'Referrer' }})
    ReferrerSchema.parentOf('Click').enforceWith('_referrer')
    var Click = mongoose.model('Click', ClickSchema);
    var Referrer = mongoose.model('Referrer', ReferrerSchema);
    var id = new mongoose.Types.ObjectId()
    var id2 = new mongoose.Types.ObjectId()
    var refId = new mongoose.Types.ObjectId()

    Referrer.create({name: 'hello', _clicks: [id, id2], _id: refId}, function(err, referrer) {
      Click.create([
        {_id: id, ip: '1234', _referrer: refId },
        {_id: id2, ip: '1234', _referrer: refId }
      ], function(err) {
        referrer._doc._clicks = [id]
        referrer.save(function(err) {
          Click.findById(id, function(err, click) {
            click._doc._referrer.should.eql(refId)

            Click.findById(id2, function(err, click) {
              should.not.exist(click._doc._referrer)
              done()
            })
          })
        })
      })
    })
  })

  it('remove parent reference from all children if child array set to blank', function(done) {
    ClickSchema.add({_referrer: { type: Schema.ObjectId, ref: 'Referrer' }})
    ReferrerSchema.parentOf('Click').enforceWith('_referrer')
    var Click = mongoose.model('Click', ClickSchema);
    var Referrer = mongoose.model('Referrer', ReferrerSchema);
    var id = new mongoose.Types.ObjectId()
    var id2 = new mongoose.Types.ObjectId()
    var refId = new mongoose.Types.ObjectId()

    Referrer.create({name: 'hello', _clicks: [id, id2], _id: refId}, function(err, referrer) {
      Click.create([
        {_id: id, ip: '1234', _referrer: refId },
        {_id: id2, ip: '1234', _referrer: refId }
      ], function(err) {
        referrer._doc._clicks = []
        referrer.save(function(err) {
          Click.find({}).exec(function(err, clicks) {
            clicks.forEach(function(c) {
              should.not.exist(c._doc._referrer)
            })
            done()
          })
        })
      })
    })
  })


  it('should remove child on remove if delete option set', function(done) {
    ClickSchema.add({_referrer: { type: Schema.ObjectId, ref: 'Referrer' }})
    ReferrerSchema.parentOf('Click').enforceWith('_referrer', {delete: true})
    var Click = mongoose.model('Click', ClickSchema);
    var Referrer = mongoose.model('Referrer', ReferrerSchema);
    var id = new mongoose.Types.ObjectId()

    Referrer.create({name: 'hello', _clicks: [id]}, function(err, referrer) {
      Click.create({_id: id, ip: '1234', _referrer: referrer._doc._id }, function(err) {
        referrer.remove(function(err) {
          Click.findById(id, function(err, click) {
            should.not.exist(click)
            done()
          })
        })
      })
    })
  })

  it('remove deletions should cascade', function(done) {
    ClickSchema.add({_referrer: { type: Schema.ObjectId, ref: 'Referrer' }})
    ClickSchema.parentOf('Other').enforceWith('_click', {delete: true})
    ReferrerSchema.parentOf('Click').enforceWith('_referrer', {delete: true})

    var Click = mongoose.model('Click', ClickSchema);
    var Referrer = mongoose.model('Referrer', ReferrerSchema);
    var id = new mongoose.Types.ObjectId()

    Other.create({field: 1}, function(err, other1) {
      Other.create({field: 2}, function(err, other2) {
        Referrer.create({name: 'hello', _clicks: [id]}, function(err, referrer) {
          var click = {
            _id: id,
            ip: '1234',
            _referrer: referrer._doc._id,
            _others: [other1._doc._id, other2._doc._id]
          }

          Click.create(click, function(err) {
            referrer.remove(function(err) {
              Click.findById(id, function(err, click) {
                should.not.exist(click)
                Other.count({}, function(err, otherCount) {
                  setTimeout(function() {
                    otherCount.should.eql(0)
                    done()
                  }, 100)
                })
              })
            })
          })
        })
      })
    })
  })
})

describe('childOf', function() {
  it('should add ref property to Schema', function() {
    ClickSchema.childOf('Referrer')
    var path = ClickSchema.path('_referrer')

    should.exist(path)
    path.instance.should.eql('ObjectID')
    path.options.ref.should.eql('Referrer')
  })

  it('should allow custom paths', function() {
    ClickSchema.manyToOne('Referrer', '_funsos')
    var path = ClickSchema.path('_funsos')

    should.exist(path)
    path.instance.should.eql('ObjectID')
    path.options.ref.should.eql('Referrer')
  })

  it('should add a reference to the object array on save', function(done) {
    ReferrerSchema.add({_clicks: [{ type: Schema.ObjectId, ref: 'Click' }]})
    ClickSchema.childOf('Referrer').enforceWith('_clicks')
    var Click = mongoose.model('Click', ClickSchema);
    var Referrer = mongoose.model('Referrer', ReferrerSchema);

    Referrer.create({name: 'hello', _clicks: []}, function(err, referrer) {
      Click.create({ip: '1234', _referrer: referrer._id }, function(err, click) {
        Referrer.findById(referrer._id, function(err, referrer) {
          referrer._doc._clicks.should.include(click._id)
          done()
        })
      })
    })
  })

  it('should do nothing if reference exists', function(done) {
    ReferrerSchema.add({_clicks: [{ type: Schema.ObjectId, ref: 'Click' }]})
    ClickSchema.childOf('Referrer').enforceWith('_clicks')
    var Click = mongoose.model('Click', ClickSchema);
    var Referrer = mongoose.model('Referrer', ReferrerSchema);
    var id = new mongoose.Types.ObjectId()

    Referrer.create({name: 'hello', _clicks: [id]}, function(err, referrer) {
      Click.create({ip: '1234', _referrer: referrer._id, _id: id }, function(err, click) {
        Referrer.findById(referrer._id, function(err, referrer) {
          referrer._doc._clicks.should.include(click._id)
          referrer._doc._clicks.length.should.eql(1)
          done()
        })
      })
    })
  })

  it('should pop reference int the object array on remove', function(done) {
    ReferrerSchema.add({_clicks: [{ type: Schema.ObjectId, ref: 'Click' }]})
    ClickSchema.childOf('Referrer').enforceWith('_clicks')
    var Click = mongoose.model('Click', ClickSchema);
    var Referrer = mongoose.model('Referrer', ReferrerSchema);
    var id = new mongoose.Types.ObjectId()
    var id2 = new mongoose.Types.ObjectId()

    Click.create({ip: 'hello', _referrer: id}, function(err, click) {
      Referrer.create({_id: id, _clicks: [click._doc._id, id2] }, function(err) {
        click.remove(function(err) {
          Referrer.findById(id, function(err, referrer) {
            referrer._doc._clicks.length.should.eql(1)
            referrer._doc._clicks.should.include(id2)
            referrer._doc._clicks.should.not.include(click._id)
            done()
          })
        })
      })
    })
  })

  it('should ignore delete option on remove', function(done) {
    ReferrerSchema.add({_clicks: [{ type: Schema.ObjectId, ref: 'Click' }]})
    ClickSchema.childOf('Referrer').enforceWith('_clicks', {delete: true})
    var Click = mongoose.model('Click', ClickSchema);
    var Referrer = mongoose.model('Referrer', ReferrerSchema);
    var id = new mongoose.Types.ObjectId()
    var id2 = new mongoose.Types.ObjectId()

    Click.create({ip: 'hello', _referrer: id}, function(err, click) {
      Referrer.create({_id: id, _clicks: [click._doc._id, id2] }, function(err) {
        click.remove(function(err) {
          setTimeout(function() {
            Referrer.findById(id, function(err, referrer) {
              referrer._doc._clicks.length.should.eql(1)
              referrer._doc._clicks.should.include(id2)
              referrer._doc._clicks.should.not.include(click._id)
              done()
            })
          }, 100)
        })
      })
    })
  })
})

describe('errorMessages', function() {
  it("creates an array of of custom errors", function(done) {
    Click.create({}, function(err, val) {
      Click.errors(err, function(messages) {
        messages.should.eql(['ip is required'])
        done();
      })
    })
  })
})
