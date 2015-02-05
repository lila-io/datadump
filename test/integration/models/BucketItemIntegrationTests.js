var
  mongoose = require('mongoose'),
  datasource = require('../../../server/conf/datasource'),
  should = require('should'),
  BucketItem = require('../../../server/models/bucketItem')
;

describe('BucketItem schema integration tests', function () {

  var dbString = datasource.testDbString();

  before(function(done){
    mongoose.connect(dbString,function(){
      BucketItem.ensureIndexes(done);
    });
  });

  after(function(done){
    mongoose.connection.db.dropDatabase(function(){
      mongoose.disconnect(done);
    });
  });

  describe('constraints tests', function () {

    it('fails if trying to save default instance', function (done) {
      BucketItem.create({},function(err){
        err.errors.should.be.an.Object;
        Object.keys(err.errors).length.should.equal(2);
        Object.keys(err.errors).should.containDeep(['bucket', 'data']);
        done();
      });
    });

    it('fails if required fields are blank',function(done){

      BucketItem.create({
        bucket: '',
        dateCreated: '',
        data: ''
      },function(err){
        err.errors.should.be.an.Object;
        Object.keys(err.errors).length.should.equal(2);
        Object.keys(err.errors).should.containDeep(['bucket', 'dateCreated']);
        done();
      });

    });

    it('fails if required fields are null',function(done){
      BucketItem.create({
        bucket: null,
        dateCreated: null,
        data: null
      },function(err){
        err.errors.should.be.an.Object;
        Object.keys(err.errors).length.should.equal(3);
        Object.keys(err.errors).should.containDeep(['bucket', 'dateCreated', 'data']);
        done();
      });
    });

    it('succeeds with data as empty string',function(done){
      BucketItem.create({
        bucket: mongoose.Types.ObjectId(),
        data: ''
      },function(err, doc){
        should(err).not.be.ok;
        doc.should.be.an.Object;
        doc.data.should.equal('');
        done();
      });
    });

    it('succeeds with data as number',function(done){
      BucketItem.create({
        bucket: mongoose.Types.ObjectId(),
        data: 0
      },function(err, doc){
        should(err).not.be.ok;
        doc.should.be.an.Object;
        doc.data.should.equal(0);
        done();
      });
    });

    it('succeeds with data as boolean',function(done){
      BucketItem.create({
        bucket: mongoose.Types.ObjectId(),
        data: false
      },function(err, doc){
        should(err).not.be.ok;
        doc.should.be.an.Object;
        doc.data.should.equal(false);
        done();
      });
    });

    it('succeeds with data as array',function(done){
      BucketItem.create({
        bucket: mongoose.Types.ObjectId(),
        data: ['hohoho',{x:'z'},[true,false],12345]
      },function(err, doc){
        should(err).not.be.ok;
        doc.should.be.an.Object;
        doc.data.length.should.equal(4);
        doc.data[0].should.equal('hohoho');
        doc.data[1].x.should.equal('z');
        doc.data[2][0].should.equal(true);
        doc.data[2][1].should.equal(false);
        doc.data[3].should.equal(12345);
        done();
      });
    });

    it('succeeds with data as object',function(done){
      BucketItem.create({
        bucket: mongoose.Types.ObjectId(),
        data: {
          x:'z',
          y: [1,2,3],
          z: {}
        }
      },function(err, doc){
        should(err).not.be.ok;
        doc.should.be.an.Object;
        doc.data.should.be.an.Object;
        doc.data.x.should.equal('z');
        doc.data.y.length.should.equal(3);
        doc.data.z.should.be.an.Object;
        done();
      });
    });

  });

});
