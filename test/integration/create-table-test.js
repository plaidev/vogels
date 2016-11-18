'use strict';

var vogels = require('../../index'),
    chai   = require('chai'),
    expect = chai.expect,
    //async  = require('async'),
    _      = require('lodash'),
    helper = require('../test-helper'),
    Joi    = require('joi');

chai.should();

describe('Create Tables Integration Tests', function() {
  this.timeout(0);

  before(function () {
    vogels.dynamoDriver(helper.realDynamoDB());
  });

  afterEach(function () {
    vogels.reset();
  });

  it('should create table with hash key', function (done) {
    var Model = vogels.define('vogels-create-table-test', {
      hashKey : 'id',
      tableName : helper.randomName('vogels-createtable-Accounts'),
      schema : {
        id : Joi.string(),
      }
    });

    Model.createTable(function (err, result) {
      expect(err).to.not.exist;

      var desc = result.TableDescription;
      expect(desc).to.exist;
      expect(desc.KeySchema).to.eql([{ AttributeName: 'id', KeyType: 'HASH' } ]);

      expect(desc.AttributeDefinitions).to.eql([
        { AttributeName: 'id', AttributeType: 'S' },
      ]);

      return Model.deleteTable(done);
    });
  });

  it('should create table with hash and range key', function (done) {
    var Model = vogels.define('vogels-createtable-rangekey', {
      hashKey : 'name',
      rangeKey : 'age',
      tableName : helper.randomName('vogels-createtable-rangekey'),
      schema : {
        name : Joi.string(),
        age : Joi.number(),
      }
    });

    Model.createTable(function (err, result) {
      expect(err).to.not.exist;

      var desc = result.TableDescription;

      expect(desc).to.exist;

      expect(desc.AttributeDefinitions).to.eql([
        { AttributeName: 'name', AttributeType: 'S' },
        { AttributeName: 'age', AttributeType: 'N' }
      ]);

      expect(desc.KeySchema).to.eql([
        { AttributeName: 'name', KeyType: 'HASH' },
        { AttributeName: 'age', KeyType: 'RANGE' }
      ]);

      return Model.deleteTable(done);
    });
  });

  it('should create table with local secondary index', function (done) {
    var Model = vogels.define('vogels-createtable-rangekey', {
      hashKey : 'name',
      rangeKey : 'age',
      tableName : helper.randomName('vogels-createtable-local-idx'),
      schema : {
        name : Joi.string(),
        age : Joi.number(),
        nick : Joi.string(),
        time : Joi.date()
      },
      indexes : [
        {hashKey : 'name', rangeKey : 'nick', type : 'local', name : 'NickIndex'},
        {hashKey : 'name', rangeKey : 'time', type : 'local', name : 'TimeIndex'},
      ]
    });

    Model.createTable(function (err, result) {
      expect(err).to.not.exist;

      var desc = result.TableDescription;

      expect(desc).to.exist;

      expect(desc.AttributeDefinitions).to.eql([
        { AttributeName: 'name', AttributeType: 'S' },
        { AttributeName: 'age', AttributeType: 'N' },
        { AttributeName: 'nick', AttributeType: 'S' },
        { AttributeName: 'time', AttributeType: 'S' }
      ]);

      expect(desc.KeySchema).to.eql([
        { AttributeName: 'name', KeyType: 'HASH' },
        { AttributeName: 'age', KeyType: 'RANGE' }
      ]);

      expect(desc.LocalSecondaryIndexes).to.have.length(2);

      expect(_.find(desc.LocalSecondaryIndexes, { IndexName: 'NickIndex' })).to.eql({
        IndexName: 'NickIndex',
        KeySchema:[
          { AttributeName: 'name', KeyType: 'HASH' },
          { AttributeName: 'nick', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
        IndexSizeBytes: 0,
        ItemCount: 0
      });

      expect(_.find(desc.LocalSecondaryIndexes, { IndexName: 'TimeIndex' })).to.eql({
        IndexName: 'TimeIndex',
        KeySchema:[
          { AttributeName: 'name', KeyType: 'HASH' },
          { AttributeName: 'time', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
        IndexSizeBytes: 0,
        ItemCount: 0
      });

      return Model.deleteTable(done);
    });
  });

  it('should create table with local secondary index with custom projection', function (done) {
    var Model = vogels.define('vogels-createtable-local-proj', {
      hashKey : 'name',
      rangeKey : 'age',
      tableName : helper.randomName('vogels-createtable-local-proj'),
      schema : {
        name : Joi.string(),
        age : Joi.number(),
        nick : Joi.string()
      },
      indexes : [{
        hashKey : 'name',
        rangeKey : 'nick',
        type : 'local',
        name : 'KeysOnlyNickIndex',
        projection : { ProjectionType: 'KEYS_ONLY'}
      }]
    });

    Model.createTable(function (err, result) {
      expect(err).to.not.exist;

      var desc = result.TableDescription;

      expect(desc).to.exist;

      expect(desc.AttributeDefinitions).to.eql([
        { AttributeName: 'name', AttributeType: 'S' },
        { AttributeName: 'age', AttributeType: 'N' },
        { AttributeName: 'nick', AttributeType: 'S' }
      ]);

      expect(desc.KeySchema).to.eql([
        { AttributeName: 'name', KeyType: 'HASH' },
        { AttributeName: 'age', KeyType: 'RANGE' }
      ]);

      expect(desc.LocalSecondaryIndexes).to.eql([
        { IndexName: 'KeysOnlyNickIndex',
          KeySchema:[
            { AttributeName: 'name', KeyType: 'HASH' },
            { AttributeName: 'nick', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'KEYS_ONLY' },
          IndexSizeBytes: 0,
          ItemCount: 0 }
      ]);

      return Model.deleteTable(done);
    });
  });

  it('should create table with global index', function (done) {
    var Model = vogels.define('vogels-createtable-global', {
      hashKey : 'name',
      rangeKey : 'age',
      tableName : helper.randomName('vogels-createtable-global'),
      schema : {
        name : Joi.string(),
        age : Joi.number(),
        nick : Joi.string()
      },
      indexes : [{hashKey : 'nick', type : 'global', name : 'GlobalNickIndex'}]
    });

    Model.createTable(function (err, result) {
      expect(err).to.not.exist;

      var desc = result.TableDescription;

      expect(desc).to.exist;

      expect(desc.AttributeDefinitions).to.eql([
        { AttributeName: 'name', AttributeType: 'S' },
        { AttributeName: 'age', AttributeType: 'N' },
        { AttributeName: 'nick', AttributeType: 'S' }
      ]);

      expect(desc.KeySchema).to.eql([
        { AttributeName: 'name', KeyType: 'HASH' },
        { AttributeName: 'age', KeyType: 'RANGE' }
      ]);

      expect(desc.GlobalSecondaryIndexes).to.eql([
        { IndexName: 'GlobalNickIndex',
          KeySchema:[
            { AttributeName: 'nick', KeyType: 'HASH' },
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput : { ReadCapacityUnits : 1, WriteCapacityUnits : 1},
          IndexSizeBytes: 0,
          IndexStatus : 'ACTIVE',
          ItemCount: 0 }
      ]);

      return Model.deleteTable(done);
    });
  });

  it('should create table with global index with optional settings', function (done) {
    var Model = vogels.define('vogels-createtable-global', {
      hashKey : 'name',
      rangeKey : 'age',
      tableName : helper.randomName('vogels-createtable-global'),
      schema : {
        name : Joi.string(),
        age  : Joi.number(),
        nick : Joi.string(),
        wins : Joi.number()
      },
      indexes : [{
        hashKey       : 'nick',
        type          : 'global',
        name          : 'GlobalNickIndex',
        projection    : { NonKeyAttributes : [ 'wins' ], ProjectionType : 'INCLUDE' },
        readCapacity  : 10,
        writeCapacity : 5
      }]
    });

    Model.createTable(function (err, result) {
      expect(err).to.not.exist;

      var desc = result.TableDescription;

      expect(desc).to.exist;

      expect(desc.AttributeDefinitions).to.eql([
        { AttributeName: 'name', AttributeType: 'S' },
        { AttributeName: 'age', AttributeType: 'N' },
        { AttributeName: 'nick', AttributeType: 'S' }
      ]);

      expect(desc.KeySchema).to.eql([
        { AttributeName: 'name', KeyType: 'HASH' },
        { AttributeName: 'age', KeyType: 'RANGE' }
      ]);

      expect(desc.GlobalSecondaryIndexes).to.eql([
        { IndexName: 'GlobalNickIndex',
          KeySchema:[
            { AttributeName: 'nick', KeyType: 'HASH' },
          ],
          Projection: { ProjectionType: 'INCLUDE', NonKeyAttributes : [ 'wins' ] },
          ProvisionedThroughput : { ReadCapacityUnits : 10, WriteCapacityUnits : 5},
          IndexSizeBytes: 0,
          IndexStatus : 'ACTIVE',
          ItemCount: 0 }
      ]);

      return Model.deleteTable(done);
    });
  });

  it('should create table with global and local indexes', function (done) {
    var Model = vogels.define('vogels-createtable-both-indexes', {
      hashKey : 'name',
      rangeKey : 'age',
      tableName : helper.randomName('vogels-createtable-both-indexes'),
      schema : {
        name : Joi.string(),
        age  : Joi.number(),
        nick : Joi.string(),
        wins : Joi.number()
      },
      indexes : [
        { hashKey : 'name', rangeKey : 'nick', type   : 'local', name        : 'NameNickIndex'},
        { hashKey : 'name', rangeKey : 'wins', type   : 'local', name        : 'NameWinsIndex'},
        { hashKey : 'nick', type     : 'global', name : 'GlobalNickIndex' },
        { hashKey : 'age' , rangeKey : 'wins', type   : 'global', name       : 'GlobalAgeWinsIndex' }
      ]
    });

    Model.createTable(function (err, result) {
      expect(err).to.not.exist;

      var desc = result.TableDescription;

      expect(desc).to.exist;

      expect(desc.AttributeDefinitions).to.eql([
        { AttributeName: 'name', AttributeType: 'S' },
        { AttributeName: 'age', AttributeType: 'N' },
        { AttributeName: 'nick', AttributeType: 'S' },
        { AttributeName: 'wins', AttributeType: 'N' }
      ]);

      expect(desc.KeySchema).to.eql([
        { AttributeName: 'name', KeyType: 'HASH' },
        { AttributeName: 'age', KeyType: 'RANGE' }
      ]);

      expect(desc.GlobalSecondaryIndexes).to.have.length(2);

      expect(_.find(desc.GlobalSecondaryIndexes, { IndexName: 'GlobalNickIndex' })).to.eql({
        IndexName: 'GlobalNickIndex',
        KeySchema:[
          { AttributeName: 'nick', KeyType: 'HASH' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput : { ReadCapacityUnits : 1, WriteCapacityUnits : 1},
        IndexSizeBytes: 0,
        IndexStatus : 'ACTIVE',
        ItemCount: 0
      });

      expect(_.find(desc.GlobalSecondaryIndexes, { IndexName: 'GlobalAgeWinsIndex' })).to.eql({
        IndexName: 'GlobalAgeWinsIndex',
        KeySchema:[
          { AttributeName: 'age', KeyType: 'HASH' },
          { AttributeName: 'wins', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput : { ReadCapacityUnits : 1, WriteCapacityUnits : 1},
        IndexSizeBytes: 0,
        IndexStatus : 'ACTIVE',
        ItemCount: 0
      });

      expect(desc.LocalSecondaryIndexes).to.have.length(2);

      expect(_.find(desc.LocalSecondaryIndexes, { IndexName: 'NameNickIndex' })).to.eql({
        IndexName: 'NameNickIndex',
        KeySchema:[
          { AttributeName: 'name', KeyType: 'HASH' },
          { AttributeName: 'nick', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
        IndexSizeBytes: 0,
        ItemCount: 0
      });

      expect(_.find(desc.LocalSecondaryIndexes, { IndexName: 'NameWinsIndex' })).to.eql({
        IndexName: 'NameWinsIndex',
        KeySchema:[
          { AttributeName: 'name', KeyType: 'HASH' },
          { AttributeName: 'wins', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
        IndexSizeBytes: 0,
        ItemCount: 0
      });

      return Model.deleteTable(done);
    });
  });
});

