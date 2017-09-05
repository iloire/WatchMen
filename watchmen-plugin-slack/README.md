# watchmen-plugin-slack

A plugin for [watchmen](https://github.com/iloire/watchmen) to send Slack
notifications on service events via
[node-slack](https://www.npmjs.com/package/node-slack).

## Slack Incoming Webhook

https://api.slack.com/incoming-webhooks

Grab your URL from here:

https://my.slack.com/services/new/incoming-webhook/

Make sure your channel matches configuration for this plugin.

## Environment variables

`WATCHMEN_SLACK_NOTIFICATION_EVENTS` and `WATCHMEN_SLACK_NOTIFICATION_URL` are
required. `WATCHMEN_SLACK_NOTIFICATION_EVENTS` should be a space separated list
of Watchmen events that will trigger Slack notifications.

The default Slack channel is `#general`.

The default icon emoji is 📣 `:mega`

The default username is `Watchmen`

```
WATCHMEN_SLACK_NOTIFICATION_EVENTS='service-back latency-warning new-outage'
WATCHMEN_SLACK_NOTIFICATION_URL='GET INCOMING WEBOOK URL FROM SLACK'
WATCHMEN_SLACK_NOTIFICATION_CHANNEL='#notifications'
WATCHMEN_SLACK_NOTIFICATION_USERNAME='Wise'
WATCHMEN_SLACK_NOTIFICATION_ICON_EMOJI=':doge2:'
```
