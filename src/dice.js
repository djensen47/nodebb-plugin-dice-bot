var Topics = module.parent.require('./topics');
var Posts = module.parent.require('./posts');
var Sockets = module.parent.require('./socket.io');
var Meta = module.parent.require('./meta');
var winston = module.parent.require('winston');


var TAG = '[plugins/dice-bot]';

var postReply = function postReply(tid, uid, content) {
  Posts.create({
    uid: uid,
    tid: tid,
    content: content
  }, function postsCreateCallback(err, postData) {
    if (err) {
      winston.err(TAG + ' error saving dice bot post');
    } else {
      winston.debug(TAG + ' success saving dice bot post');
      var result = {
        posts: [postData],
	privileges: { 'topics:reply': true },
	'reputation:disabled': parseInt(Meta.config['reputation:disabled'], 10) === 1,
	'downvote:disabled': parseInt(Meta.config['downvote:disabled'], 10) === 1
      };
      winston.info(TAG);
      winston.info(postData);
      Sockets.in('uid_'+uid).emit('event:new_post', result);
      //Sockets.server.sockets.emit('event:new_post', result);
    }
  });
/*
  Topics.reply({
    tid: tid,
    uid: 2,
    content: content
  });
*/
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
    var uid = 2;
    postReply(tid, uid, content);
  }
};

module.exports = Dicebot
