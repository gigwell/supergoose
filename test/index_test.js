var mocha = require('mocha')
  , should = require('should')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , supergoose = require('../index.js')

mongoose.connect('mongodb://localhost:27017/supergoose')
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

var messages =  {
  'required': "%s is required"
}

ClickSchema.plugin(supergoose, {messages: messages});
var Click = mongoose.model('Click', ClickSchema);
var Referrer = mongoose.model('Referrer', ReferrerSchema);

afterEach(function(done) {
  Click.find().remove()
  Referrer.find().remove()
  done();
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
