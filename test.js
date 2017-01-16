var request = require('request'),
    chai = require("chai"),
    sinon = require('sinon'),
    sinonChai = require("sinon-chai"),
    httpMocks = require('node-mocks-http'),
    util = require('util'),
    expect = chai.expect,
    pg2c = require('./pg2c');

chai.use(sinonChai);

var single_content = {
  shows: {
    next: [
      {
        name: "IT-Reaktion, die Show",
        description: "This is tha show.",
        genre: "",
        id: 1,
        instance_id: 1000,
        record: 0,
        url: "http://example.com",
        image_path: null,
        starts: '2016-12-26 20:00:00',
        ends: '2016-12-26 21:00:00'
      }
    ],
  },
};

beforeEach(function () {
  this.sinon = sinon.sandbox.create();
  this.clock = sinon.useFakeTimers();
});

afterEach(function () {
  this.sinon.restore();
  this.clock.restore();
});

describe('program-grid-2-caldav', function () {
  it('should read env variables', function() {

    var airtimeTestString = 'http://air.example.org';
    var caldavTestString = 'http://cal.example.org';
    process.env.AIRTIME_ENDPOINT = airtimeTestString;
    process.env.CALDAV_ENDPOINT = caldavTestString;

    var sut = pg2c();
    expect(sut.config.airtime).to.eql(airtimeTestString);
    expect(sut.config.caldav).to.eql(caldavTestString);

    delete process.env.AIRTIME_ENDPOINT;
    delete process.env.CALDAV_ENDPOINT;
  });
  it('should make a request to the airtime api', function() {
    var content = {
      shows: {
        next: [],
      },
    };
    var requestStub = this.sinon.stub(request, 'get', function (url, cb) {
      var res = httpMocks.createResponse();
      res.statusCode = 201;
      cb(false, res, content);
    });


    var sut = pg2c();
    sut.run();

    expect(requestStub).to.have.been.calledWith({
      url: 'http://airtime.vcap.me/api/live-info-v2?days=60&shows=600000000',
      json: true
    });
  });
  it('should put each show to the caldav api', function() {
    var card = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//sebbo.net//ical-generator//EN",
      "NAME:Grid",
      "X-WR-CALNAME:Grid",
      "BEGIN:VEVENT",
      "UID:1-1000@calendar.vcap.me",
      "SEQUENCE:0",
      "DTSTAMP:19700101T000000Z",
      "DTSTART:20161226T190000Z",
      "DTEND:20161226T200000Z",
      "SUMMARY:IT-Reaktion\\, die Show",
      "DESCRIPTION:This is tha show.",
      "URL;VALUE=URI:http://example.com",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    var airtimeStub = this.sinon.stub(request, 'get', function (url, cb) {
      var res = httpMocks.createResponse();
      res.statusCode = 201;
      cb(false, res, single_content);
    });

    var caldavStub = this.sinon.stub(request, 'put', function (options, cb) {
      var res = httpMocks.createResponse();
      res.statusCode = 201;
      cb(false, res, null);
    });

    var sut = pg2c();
    sut.run();

    expect(airtimeStub).to.have.been.calledWith(sinon.match.typeOf('object'));
    expect(caldavStub).to.always.have.been.calledWith(sinon.match.typeOf('object'));
    expect(caldavStub).to.always.have.been.calledWith(sinon.match.has('url', 'http://calendar.vcap.me/grid/calendar.ics/1-1000'));
    expect(caldavStub).to.always.have.been.calledWith(sinon.match.has('headers', { 'Content-Type': 'text/calendar; charset=utf-8' }));
    expect(caldavStub).to.always.have.been.calledWith(sinon.match.has('body', card));
  });
  it('should log errors if airtime fails', function() {
    var airtimeStub = this.sinon.stub(request, 'get', function (url, cb) {
      cb({ code: 'error'}, httpMocks.createResponse(), null);
    });

    var logStub = this.sinon.stub(util, 'log');
    var sut = pg2c();
    sut.run();

    expect(airtimeStub).to.have.been.calledWith(sinon.match.typeOf('object'));
    expect(logStub).to.have.been.calledWith(sinon.match('Unknown error from Airtime API'));
  });
  it('should log errors if airtime returns 500', function() {
    var airtimeStub = this.sinon.stub(request, 'get', function (url, cb) {
      res = httpMocks.createResponse();
      res.statusCode = 500;
      cb({ code: 'error' }, res, null);
    });

    var logStub = this.sinon.stub(util, 'log');
    var sut = pg2c();
    sut.run();

    expect(airtimeStub).to.have.been.calledWith(sinon.match.typeOf('object'));
    expect(logStub).to.have.been.calledWith(sinon.match('Error from Airtime API: 500'));
  });
  it('should log errors if caldav fails', function() {
    var airtimeStub = this.sinon.stub(request, 'get', function (url, cb) {
      cb(null, httpMocks.createResponse(), single_content);
    });
    var caldavStub = this.sinon.stub(request, 'put', function (options, cb) {
      cb({ code: 'error' }, null, null);
    });
    var logStub = this.sinon.stub(util, 'log');

    var sut = pg2c();
    sut.run();

    expect(logStub).to.have.been.calledWith(sinon.match('Error talking to CalDAV'));
  });
  it('should log errors if card is rejected by server', function() {
    var airtimeStub = this.sinon.stub(request, 'get', function (url, cb) {
      cb(null, httpMocks.createResponse(), single_content);
    });
    var caldavStub = this.sinon.stub(request, 'put', function (options, cb) {
      var res = httpMocks.createResponse();
      res.statusCode = 500;
      cb(false, res, null);
    });
    var logStub = this.sinon.stub(util, 'log');

    var sut = pg2c();
    sut.run();

    expect(logStub).to.have.been.calledWith(sinon.match('Error creating record: 1-1000'));
  });
});
