'use strict';

var path = require('path');
var fileName = path.basename(__filename, '.js'); // gives the filename without the .js extension
var log = require('debug')('boot:'+fileName);

module.exports = function(app) {
  var Role = app.models.Role;

  Role.registerResolver('$masterKey', function(role, context, callback) {
    log('context.modelName: ', context.modelName);
    log('context.accessToken: ', context.accessToken);

    var masterKey = context.remotingContext.req.query['masterKey'];
    log('context.remotingContext.req.query[masterKey]: ',masterKey);

    function reject() {
      process.nextTick(function() {
        callback(null, false);
      });
    }

    var Application = app.models.Application;
    Application.find(
      {where: {masterKey: masterKey}},
      function(err, app) {
        if (err) {
          log('ERROR', err);
          console.error(err);
          return reject();
          //throw err;
        }
        log(app);
        callback(null, (masterKey && app && app.length===1));
      });

  });

  Role.registerResolver('teamMember', function(role, context, cb) {
    function reject() {
      process.nextTick(function() {
        cb(null, false);
      });
    }

    // if the target model is not StoreConfigModel
    if (context.modelName !== 'StoreConfigModel') {
      log('the target model is not StoreConfigModel');
      return reject();
    }

    // do not allow anonymous users
    var userId = context.accessToken.userId;
    if (!userId) {
      log('do not allow anonymous users');
      return reject();
    }

    // check if userId is in team table for the given project id
    context.model.findById(context.modelId, function(err, storeConfigModel) {
      if (err || !storeConfigModel) {
        log('err || !storeConfigModel');
        return reject();
      }

      var TeamModel = app.models.TeamModel;
      TeamModel.count({
        ownerId: storeConfigModel.userModelToStoreConfigModelId,
        memberId: userId
      }, function(err, count) {
        if (err) {
          console.log(err);
          return cb(null, false);
        }

        log('is a team member');
        cb(null, count > 0); // true = is a team member
      });
    });
  });

  /*Role.registerResolver('$manager', function(role, context, callback) {
  });

  Role.registerResolver('$warehouse', function(role, context, callback) {
  });

  Role.registerResolver('$receiver', function(role, context, callback) {
  });*/

};
