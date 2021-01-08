var Topics = require.main.require('./src/topics');
var SocketHelpers = require.main.require('./src/socket.io/helpers')
var User = require.main.require('./src/user');
var Meta = require.main.require('./src/meta');
var winston = require.main.require('winston');

var TAG = '[plugins/dice-bot]';
var MINUTES = 60 * 1000;

var postReply = function postReply(tid, uid, content) {
  // var uid = Dicebot._settings.diceBotUid;
  winston.info(TAG + ' dicebot uid: ' + uid);
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
      User.setUserField(uid, 'lastposttime', Date.now - 2*MINUTES, function setUserFieldCB(err) {
        if (err) {
          winston.error(TAG + ' error setting lastposttime on bot user ('+uid+'): ' + err);
        } else {
          var result = {
            posts: [postData],
            privileges: { 'topics:reply': true },
            'reputation:disabled': parseInt(Meta.config['reputation:disabled'], 10) === 1,
            'downvote:disabled': parseInt(Meta.config['downvote:disabled'], 10) === 1
          };
  	      SocketHelpers.notifyNew(parseInt(uid, 10), 'newPost', result);
        }
      });
    }
  });
};

var executeDice = function executeDice(diceTags) {
  var results = [];
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

      var result = { cmd: cmd, roll: roll(num, sides, modifier)};
      results.push(result);
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
  var hostMiddleware = require.main.require('./src/middleware');
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
  header.plugins.push({
    route: '/plugins/dice-bot',
    name: 'Dice Bot'
  });

  callback(null, header);
};

Dicebot.postDice = function(data) {
  var uid = Dicebot._settings.diceBotUid;

  if (data.post.uid === uid) {
    // if the post is from dicebot, don't do anything
    return;
  }
  var tid = data.post.tid;

  //content without quotes, don't want to roll dice from quoted strings
  var content = data.post.content.replace(/^>.*\n/gm, '');
  var re = /\[dice( \d*d\d+([-\+]\d+)*([<>]=*\d+)*)+\]+/gm;
  var diceRe = /\[dice (\d)*d(\d+)([-\+]\d+){0,1}(([<>]=*)(\d+))*\]/;

  if (content) {
    var matches = content.match(re);
    if (matches) {
      var results = executeDice(matches);
      var content = '';
      for(var result of results) {
        content += `**${result.cmd}:** ${result.roll.join(', ')}\n`;
      }
      postReply(tid, uid, content);
    }
  }
};

module.exports = Dicebot;
