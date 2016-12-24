var request = require('request'),
    chai = require("chai"),
    sinon = require('sinon'),
    sinonChai = require("sinon-chai"),
    httpMocks = require('node-mocks-http'),
    expect = chai.expect,
    pg2c = require('./pg2c');

chai.use(sinonChai);

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
    process.env.REQUEST_THROTTLE_NUM = 10;
    process.env.REQUEST_THROTTLE_TIME = 1000;

    var sut = pg2c();
    expect(sut.config.airtime).to.eql(airtimeTestString);
    expect(sut.config.caldav).to.eql(caldavTestString);
    expect(sut.config.throttle.caldav.num).to.eql(10);
    expect(sut.config.throttle.caldav.time).to.eql(1000);

    delete process.env.AIRTIME_ENDPOINT;
    delete process.env.CALDAV_ENDPOINT;
    delete process.env.REQUEST_THROTTLE_NUM;
    delete process.env.REQUEST_THROTTLE_TIME;
  });
  it('should make a request to the airtime api', function() {
    var content = {
      shows: {
        next: [],
      },
    };
    var requestStub = this.sinon.stub(request, 'get', function (url, cb) {
      cb(null, null, content);
    });


    var sut = pg2c();
    sut.run();

    expect(requestStub).to.have.been.calledWith({
      url: 'http://airtime.vcap.me/api/live-info-v2?days=60&shows=600000000',
      json: true
    });
  });
  it('should put each show to the caldav api', function() {
    var content = {
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
      cb(null, null, content);
    });
    var caldavStub = this.sinon.stub(request, 'Request', function (options) {
      var res = httpMocks.createResponse();
      res.statusCode = 201;
      options.callback(false, res);
    });

    var sut = pg2c();
    sut.run();

    expect(airtimeStub).to.have.been.calledWith({
      url: 'http://airtime.vcap.me/api/live-info-v2?days=60&shows=600000000',
      json: true
    });
    expect(caldavStub).to.always.have.been.calledWith(sinon.match.has('method', 'PUT'));
    expect(caldavStub).to.always.have.been.calledWith(sinon.match.has('url', 'http://calendar.vcap.me/grid/calendar.ics/1-1000'));
    expect(caldavStub).to.always.have.been.calledWith(sinon.match.has('headers', { 'Content-Type': 'text/calendar; charset=utf-8' }));
    expect(caldavStub).to.always.have.been.calledWith(sinon.match.has('body', card));
  });
});
describe.skip('program-grid-2-caldav', function () {
  it('should log errors if airtime fails', function() {});
  it('should log errors if caldav fails', function() {});
});
