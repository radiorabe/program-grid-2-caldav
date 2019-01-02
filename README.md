# program grid 2 CalDAV

Proof of concept code to transpose data from airtimes /api/live-info-v2 API to a CalDAV instance.

## Requirements

* nodejs

## Installation

```bash
yarn install
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

## Testing

```bash
yarn test

# coverage info
yarn run coverage
```
