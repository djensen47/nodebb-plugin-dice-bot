var Topics = module.parent.require('./topics');

var Dicebot = {};

Dicebot.postDice = function(postData) {
  var tid = postData.tid;
  Topics.reply({
    tid: tid,
    uid: 2,
    content: "Dice bot! Shazbot!"
  });
};

module.exports = Dicebot
