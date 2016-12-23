var request = require('request'),
    throttledRequest = require('throttled-request')(request),
    ical = require('ical-generator');

// config (overridable by env)
var airtime_endpoint = process.env.AIRTIME_ENDPOINT || 'https://airtime.vcap.me/api/live-info-v2?days=60&shows=600000000';
var caldav_calendar = process.env.CALDAV_ENDPOINT || 'http://calendar.vcap.me/grid/calendar.ics/';

// throttling used to make sure CalDAV server is not overwhelmed
throttledRequest.configure({
  requests: process.env.REQUEST_THROTTLE_NUM || 1,
  milliseconds: process.env.REQUEST_THROTTLE_TIME || 200
});

// create ical events based on data from api
function populateFromJson(data) {
  data.shows.next.map(function(show) {
    var uid = show.id + "-" + show.instance_id;
    var properUrl = show.url === '' && 'http://rabe.ch' || show.url;

    var cal = ical({name: "Grid"});
    var event = cal.createEvent({
      uid: uid,
      start: new Date(Date.parse(show.starts)),
      end: new Date(Date.parse(show.ends)),
      summary: show.name,
      description: show.description,
      url: properUrl,
      // todo: use image_path to generate a nice htmlDescription (after figuring out how to populate it)
    });

    // upsert event
    storeEvent(event.uid(), cal.toString());
  });
}

// send individual records to radicale (server upserts based on uid value)
function storeEvent(uid, body) {
  throttledRequest({
    method: 'PUT',
    url: caldav_calendar + uid,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8'
    },
    body: body
  }, function(err, res) {
    if (err) {
      console.log('Error storing data to CalDAV');
    } else if (res.statusCode != 201) {
      console.log('Error creating record ' + uid);
    }
  });
}

// fetch data from airtime api
request.get({
  url: airtime_endpoint,
  json: true
}, function (err, jsonRes, data) {
  if (err) {
    console.log('Error from Airtime API');
  } else {
    populateFromJson(data);
  }
});
