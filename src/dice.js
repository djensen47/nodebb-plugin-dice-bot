var Topics = module.parent.require('./topics');
var Posts = module.parent.require('./posts');
var Sockets = module.parent.require('./socket.io');
var SocketHelpers = module.parent.require('./socket.io/helpers')
var User = module.parent.require('./user');
var Meta = module.parent.require('./meta');
var winston = module.parent.require('winston');

var TAG = '[plugins/dice-bot]';
var BOT_UID = 2;
var MINUTES = 60 * 1000;

var postReply = function postReply(tid, uid, content) {
  Topics.reply({
    tid: tid,
    uid: BOT_UID,
    content: content
  }, function(err, postData) {
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
  });
};

var Dicebot = {};

Dicebot.postDice = function(postData, callback) {
  winston.debug('[plugins/dice-bot] postDice');
  var tid = postData.tid;
  var content = postData.content;
  var re = /\[dice (.*)\]/g;
  if (content && content.match(re)) {
    winston.info('[plugins/dice-bot] match!');
    var rand = Math.floor((Math.random() * 6) + 1);
    var content = "Dice bot! Shazbot! " + rand;
    var uid = BOT_UID;
    postReply(tid, uid, content);
  }
};

module.exports = Dicebot
