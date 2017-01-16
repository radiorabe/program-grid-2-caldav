var request = require('request'),
    ical = require('ical-generator'),
    moment = require('moment-timezone'),
    url = require('url'),
    util = require('util');

var config = {};

// default config (overridable by env)
function configure() {
  return {
    airtime: process.env.AIRTIME_ENDPOINT || 'http://airtime.vcap.me/api/live-info-v2?days=60&shows=600000000',
    caldav: process.env.CALDAV_ENDPOINT || 'http://calendar.vcap.me/grid/calendar.ics/',
  };
}

// create ical events based on data from api
function populateFromJson(data) {
  var stationTz = data.station.timezone;
  data.shows.next.map(function(show) {
    var uid = show.id + "-" + show.instance_id;
    var properUrl = show.url === '' && 'http://rabe.ch' || show.url;

    var cal = ical({domain: url.parse(config.caldav).hostname, name: "Grid"});
    var event = cal.createEvent({
      uid: uid,
      start: moment.tz(show.starts, stationTz).toDate(),
      end: moment.tz(show.ends, stationTz).toDate(),
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
  var options = {
    url: config.caldav + uid,
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
    body: body
  };
  request.put(options, function(err, res) {
    if (err) {
      util.log('Error talking to CalDAV: ' + err.code + ' while writing record: ' + uid );
    } else if (res.statusCode != 201) {
      util.log('Error creating record: ' + uid);
    }
  });
}

// fetch data from airtime api
function main() {
  request.get({
    url: config.airtime,
    json: true
  }, function (err, jsonRes, data) {
    if (err) {
      if (jsonRes.statusCode !== 200) {
        util.log('Error from Airtime API: ' + jsonRes.statusCode);
      } else {
        util.log('Unknown error from Airtime API');
      }
    } else {
      populateFromJson(data);
    }
  });
}

module.exports = function() {
  config = configure();
  return {
    config: config,
    run: main,
  };
};

