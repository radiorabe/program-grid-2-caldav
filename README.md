# program grid 2 CalDAV

Proof of concept code to transpose data from airtimes /api/live-info-v2 API to a CalDAV instance.

## Requirements

* nodejs

## Installation

```bash
npm install
```

## Usage

```bash
AIRTIME_ENDPOINT="http://airtime.example.org/api/live-info-v2?days=60&shows=600000000"
CALDAV_ENDPOINT="http://calendar.example.org/grid/calendar.ics/"
node index
```

## Configuration

All configuration is done through environment variables. In addition to what node supports per default, program-grid-2-caldav also
uses the following variables.

| ENV | Description | Default |
| --- | ----------- | ------- |
| AIRTIME_ENDPOINT | Airtime live-info-v2 endpoint URL | `http://airtime.vcap.me/api/live-info-v2?days=60&shows=600000000`
| CALDAV_ENDPOINT | Full URL to CalDAV calendar (with trailing slash) | `http://calendar.vcap.me/grid/calendar.ics/`
| REQUEST_THROTTLE_NUM | Number of CalDAV requests per REQUEST_THROTTLE_TIME | `1`
| REQUEST_THROTTLE_TIME | Time in ms over which REQUEST_THROTTLE_NUM CalDAV requests get sent | `200`

## Testing

```bash
npm test

# coverage info
npm run coverage
```
