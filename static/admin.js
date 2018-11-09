'use strict';
/* globals $, app, socket */

define('admin/plugins/dice-bot', ['settings'], function (Settings) {
  var ACP = {};

  ACP.init = function () {

    Settings.load('dice-bot', $('.dice-bot-settings')); 

    $('#save').on('click', function() {
      console.log('#save clicked');
      Settings.save('dice-bot', $('.dice-bot-settings'), function() {
          app.alert({
            type: 'success',
            alert_id: 'dice-bot-saved',
            title: 'Settings Saved',
            message: 'Please reload your NodeBB to apply these settings',
            clickfn: function () {
              socket.emit('admin.reload');
            }
          });
      });
    });
  };

  return ACP;
});
