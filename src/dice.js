var Topics = module.parent.require('./topics');
var Posts = module.parent.require('./posts');
var Sockets = module.parent.require('./socket.io');
var SocketHelpers = module.parent.require('./socket.io/helpers')
var User = module.parent.require('./user');
var Meta = module.parent.require('./meta');
var winston = module.parent.require('winston');

var TAG = '[plugins/dice-bot]';
var BOT_UID = 12390;
var MINUTES = 60 * 1000;

var postReply = function postReply(tid, uid, content) {
  var uid = Dicebot._settings.diceBotUid;
  winston.verbose(TAG + ' uid: ' + uid);
  //TODO async.waterfall this
  Topics.reply({
    tid: tid,
    uid: uid,
    content: content
  }, function(replyErr, postData) {
    if (replyErr) {
      winston.error(TAG + ' Error replying: ' + replyErr);
      return;
    } else {
      winston.verbose(TAG + ' ' + JSON.stringify(postData));
      User.setUserField(BOT_UID, 'lastposttime', Date.now - 2*MINUTES, function setUserFieldCB(err) {
        if (err) {
          winston.error(TAG + ' error setting lastposttime on bot user ('+BOT_UID+'): ' + err);
        } else {
          var result = {
            posts: [postData],
            privileges: { 'topics:reply': true },
            'reputation:disabled': parseInt(Meta.config['reputation:disabled'], 10) === 1,
            'downvote:disabled': parseInt(Meta.config['downvote:disabled'], 10) === 1
          };
  	SocketHelpers.notifyOnlineUsers(parseInt(uid, 10), result);
          //Sockets.in('uid_'+uid).emit('event:new_post', result);
        }
      });
    }
  });
};

var executeDice = function executeDice(diceTags) {
  winston.verbose(TAG + ' ' + JSON.stringify(diceTags));
  var dice = [];
  var results = {};
  var diceRe = /(\d+)*d(\d+)([-\+]\d+){0,1}(([<>]=*)(\d+))*/;
  for(var i = 0; i < diceTags.length; i++) {
    var cmds = diceTags[i].replace(/[\[\]]/g,'').split(' ').slice(1);
    for(var j = 0; j < cmds.length; j++) {
      var cmd = cmds[j];
      var params = cmd.match(diceRe);

      if (!params[1]) params[1] = '1';
      if (!params[3]) params[3] = '0';
      var num = parseInt(params[1]);
      var sides = parseInt(params[2]);
      var modifier = parseInt(params[3]);

      results[cmd] = roll(num, sides, modifier);
    }
  }
  return results;
}

var roll = function roll(num, sides, modifier) {
  var results = [];
  for (var i = 0; i < num; i++) {
    results.push( Math.floor(Math.random() * sides + 1) + modifier );
  }
  return results;
};

var Dicebot = {
  _settings: {}
};

Dicebot.init = function(data, callback) {
  winston.verbose(TAG + ' init'); 
  var hostMiddleware = module.parent.require('./middleware');
  var controllers = require('./controllers');

  data.router.get('/admin/plugins/dice-bot', hostMiddleware.admin.buildHeader, controllers.renderAdminPage);
  data.router.get('/api/admin/plugins/dice-bot', controllers.renderAdminPage);

  // Retrieve settings
    Meta.settings.get('dice-bot', function (err, settings) {
    Object.assign(Dicebot._settings, settings);
    callback();
  });	
};

Dicebot.addAdminNavigation = function (header, callback) {
  winston.verbose(TAG + ' addAdminnavigation'); 
  header.plugins.push({
    route: '/plugins/dice-bot',
    name: 'Dice Bot'
  });

  callback(null, header);
};

Dicebot.postDice = function(data) {
  winston.verbose('[plugins/dice-bot] postDice: ' + JSON.stringify(data.post));


  var uid = Dicebot._settings.diceBotUid;
  winston.verbose(TAG + ' uid = ' +uid);
  if (data.post.uid === uid) {
  	winston.verbose('[plugins/dice-bot] bot');
    return;
  } else {
  	winston.verbose('[plugins/dice-bot] not bot');
  }
  var tid = data.post.tid;

  //content without quotes, don't want to roll dice from quoted strings
  var content = data.post.content.replace(/^>.*\n/gm, '');
  winston.verbose(TAG + ' content'); 
  var re = /\[dice( \d*d\d+([-\+]\d+)*([<>]=*\d+)*)+\]+/gm;
  winston.verbose(TAG + ' re'); 
  var diceRe = /\[dice (\d)*d(\d+)([-\+]\d+){0,1}(([<>]=*)(\d+))*\]/;
  winston.verbose(TAG + ' diceRe'); 

  winston.verbose('[plugins/dice-bot] content: ' + content);
  if (content) {
    var matches = content.match(re);
    if (matches) {
      winston.verbose('[plugins/dice-bot] matches');
      var results = executeDice(matches);
      var content = '';
      winston.verbose(TAG + ' ' + JSON.stringify(results));
      for(var key in results) {
        content += `**${key}:** ${results[key].join(', ')}\n`;
      }
      var uid = BOT_UID;
      postReply(tid, uid, content);
    } else {
      winston.verbose(TAG + ' no match');
		}
  }
};

module.exports = Dicebot
