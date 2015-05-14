var
  config = require('../conf/config'),
  datasource = require('../conf/datasource'),
  BaseModel = require('./baseModel')
  ;

function Bucket(props){
  BaseModel.call(this, {
    column_family: 'buckets',
    columns: {
      name: {type: 'text', required: true},
      description: {type: 'text'},
      username: {type: 'text', required: true},
      date_created: {type: 'timestamp', required: true},
      is_public: {type: 'boolean'}
    }
  });

  this.props = props;
  this.allErrors = {errors:[]};
}
util.inherits(Bucket, BaseModel);

Bucket.prototype.getRequiredFields = function(){
  var fields = [], self = this;
  Object.keys(self.columns).forEach(function(col,idx){
    if(self.columns[col].required){
      fields.push(col);
    }
  });
}

Bucket.prototype.validate = function(){

  var self = this;
  var required = this.getRequiredFields();

  required.forEach(function(key,idx){
    if(!self.props[key]){
      self.allErrors.errors.push( {error:(key + ' is required')} )
    }
  });

  if(self.allErrors.errors.length){
    return false;
  }

  return true;
};

Bucket.prototype.errors = function(){
  return this.allErrors;
};

Bucket.prototype.save = function(callback){

  var self = this;

  if(!self.validate()){
    return callback(self.errors());
  }

  self.prepareInsertStatement(self.props, function(err,statement){
    datasource.getClient().execute(statement.query, statement.values, {prepare: true}, function(err){
      if(err) {
        callback(err);
      } else {
        callback(null,self);
      }
    });
  });
};

Bucket.prototype.delete = function(){};

module.exports = Bucket;
