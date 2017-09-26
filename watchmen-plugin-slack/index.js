var colors = require('colors');
var moment = require('moment');

var merge = require('merge');
var Slack = require('node-slack');
require('dotenv').load({ silent: true });


var defaultOptions = {
  channel: '#watchmen_alert',
  username: 'Watchmen',
  icon_emoji: ':mega:'
};

console.log("Watchmen Events "+ process.env.WATCHMEN_SLACK_NOTIFICATION_EVENTS)
var notifications = process.env.WATCHMEN_SLACK_NOTIFICATION_EVENTS.split(' ');
console.log('Slack notifications are turned on for:');
console.log(notifications);

var color = {
    "down" : "#F35A00",
    "back" : "#ABCCA3",
    "yellow": "#ffff00"
};

var friendlyNames = {
    'latency-warning': 'Latency Warning',
    'new-outage':      'New Outage',
    'current-outage':  'Current Outage',
    'service-back':    'Service Back',
    'service-error':   'Service Error',
    'service-ok':      'Service OK'
};


if ('WATCHMEN_SLACK_NOTIFICATION_CHANNEL' in process.env) {
  defaultOptions.channel = process.env.WATCHMEN_SLACK_NOTIFICATION_CHANNEL;
}

if ('WATCHMEN_SLACK_NOTIFICATION_USERNAME' in process.env) {
  defaultOptions.username = process.env.WATCHMEN_SLACK_NOTIFICATION_USERNAME;
}

if ('WATCHMEN_SLACK_NOTIFICATION_ICON_EMOJI' in process.env) {
  defaultOptions.icon_emoji = process.env.WATCHMEN_SLACK_NOTIFICATION_ICON_EMOJI;
}


function sendSlackMessage(textMsg, errorText, colorCode){
    var options = {
        text: '  ',
        attachments: [
            {
                "text": textMsg,
                "fields": [
                    {
                        "title": "Reason",
                        "value": errorText,
                        "short": true
                    }
                ],
                "color": colorCode
            }
        ]
    };
    var slack = new Slack(process.env.WATCHMEN_SLACK_NOTIFICATION_URL);
    slack.send(merge(defaultOptions, options));
    console.log("Message Sent to Slack")
}

var eventHandlers = {
    /**
     * On a new outage
     * @param service
     * @param outage
     */

    onNewOutage: function (service, outage) {
        var errorMsg = "<"+process.env.WATCHMEN_BASE_URL+"|"+ service.name +'> down!';
        sendSlackMessage(errorMsg, outage.error, color.down);
        console.log("On New Outage")
    },

    /**
     * Failed ping on an existing outage
     * @param service
     * @param outage
     */

    onCurrentOutage: function (service, outage) {
        var errorMsg = "<"+process.env.WATCHMEN_BASE_URL+"|"+ service.name +'>  is still down! ';
        sendSlackMessage(errorMsg, JSON.stringify(outage.error), color.down);
    },

    /**
     * Warning alert
     * @param service
     * @param data.elapsedTime ms
     */

    onLatencyWarning: function (service, data) {
        var msg = "<"+process.env.WATCHMEN_BASE_URL+"|"+ service.name +'> latency warning';
        sendSlackMessage(msg, ' Took: ' + (data.elapsedTime + ' ms.'), color.yellow);
    },

    /**
     * Service is back online
     * @param service
     * @param lastOutage
     */

    onServiceBack: function (service, lastOutage) {
        var duration = moment.duration(+new Date() - lastOutage.timestamp, 'seconds');
        var msg = '<'+process.env.WATCHMEN_BASE_URL+'|'+ service.name +'> is back';
        sendSlackMessage(msg, ' Down for ' + duration.humanize(), color.back);
    },

    /**
     * Service is responding correctly
     * @param service
     * @param data
     */

    onServiceOk: function (service, data) {
        var responseTimeMsg = data.elapsedTime + ' ms.';
        var serviceOkMsg = '<'+process.env.WATCHMEN_BASE_URL+'|'+ service.name +'> responded ' + 'OK!';
        sendSlackMessage(serviceOkMsg, responseTimeMsg, color.back);
    }
};


function handleAlert(eventname){
    console.log("inside Handle Alert == ", eventname)
    return function(service, data) {
        if (notifications.indexOf(eventname) === -1) {
            return;
        }

        if (eventname == 'latency-warning') {
            eventHandlers.onLatencyWarning(service, data);
        } else if (eventname == 'new-outage') {
            eventHandlers.onNewOutage(service, data);
        } else if (eventname == 'current-outage') {
            eventHandlers.onCurrentOutage(service, data);
        } else if (eventname == 'service-back') {
            eventHandlers.onServiceBack(service, data);
        } else if (eventname == 'service-ok') {
            eventHandlers.onServiceOk(service, data);
        } else {
            return
        }
    };
}

exports = module.exports = SlackPlugin;

function SlackPlugin(watchmen) {
  watchmen.on('latency-warning', handleAlert('latency-warning'));
  watchmen.on('new-outage',      handleAlert('new-outage'));
  watchmen.on('current-outage',  handleAlert('current-outage'));
  watchmen.on('service-back',    handleAlert('service-back'));
  //watchmen.on('service-error',   handleAlert('service-error'));
  watchmen.on('service-ok',      handleAlert('service-ok'));
}


