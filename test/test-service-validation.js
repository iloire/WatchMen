var assert = require('assert');
var serviceValidator = require('../lib/service-validator');

var service;

describe('service validator', function () {

  beforeEach(function () {
    service = {
      name: 'my service',
      interval: 60 * 1000,
      failureInterval: 20 * 1000,
      url: 'http://apple.dev',
      port: 443,
      timeout: 10000,
      warningThreshold: 3000,
      pingServiceName: 'http',
      restrictedTo: 'user@domain.com, admin@domain.com'
    };
  });

  it('should have an "name" field', function () {
    checkNonEmpty('name');
  });

  it('should have an "url" field', function () {
    checkNonEmpty('url');
  });

  it('should have a "pingServiceName" field', function () {
    checkNonEmpty('pingServiceName');
  });

  describe('"interval" field', function () {
    it('should exist', function () {
      checkNonEmpty('interval');
    });

    it('should have a minimum value of 500ms', function () {
      service.interval = 400;
      var errors = serviceValidator.validate(service);
      assert.equal(errors.length, 1);
      assert.equal(errors[0].field, 'interval');
    });
  });

  describe('"failureInterval" field', function () {
    it('should exist', function () {
      checkNonEmpty('failureInterval');
    });

    it('should have a minimum value of 500ms', function () {
      service.failureInterval = 400;
      var errors = serviceValidator.validate(service);
      assert.equal(errors.length, 1);
      assert.equal(errors[0].field, 'failureInterval');
    });
  });

  describe('"port" field', function () {
    it('should exist', function () {
      checkNonEmpty('port');
    });

    it('should have a numeric value', function () {
      checkIntField('3434invalidnumber', 'port');
    });

    it('should reject negative values', function () {
      checkIntField(-1, 'port');
    });
  });

  describe('"failuresToBeOutage" field', function () {
    it('should have a numeric value', function () {
      checkIntField('3434invalidnumber', 'failuresToBeOutage');
    });

    it('should reject negative values', function () {
      checkIntField(-2, 'failuresToBeOutage');
    });
  });

  describe('"timeout" field', function () {
    it('should exist', function () {
      checkNonEmpty('timeout');
    });

    it('should have a numeric value', function () {
      checkIntField('3434invalidnumber', 'timeout');
    });

    it('should not be negative', function () {
      checkIntField(-1000, 'timeout');
    });
  });

  describe('"warningThreshold" field', function () {
    it('should exist', function () {
      checkNonEmpty('warningThreshold');
    });

    it('should have a numeric value', function () {
      checkIntField('3434invalidnumber', 'warningThreshold');
    });
  });

  describe('"restrictedTo" field', function () {
    it('should reject invalid emails', function () {
      service.restrictedTo = 'invalidemail, user@domain.com';
      var errors = serviceValidator.validate(service);
      assert.equal(errors.length, 1, errors);
      assert.equal(errors[0].field, 'restrictedTo');
    });

    it('should reject empty values', function () {
      service.restrictedTo = 'admin@domain.com, , user@domain.com';
      var errors = serviceValidator.validate(service);
      assert.equal(errors.length, 1, errors);
      assert.equal(errors[0].field, 'restrictedTo');
    });

    it('should validate if input is correct', function () {
      service.restrictedTo = 'admin@domain.com, user@domain.com';
      var errors = serviceValidator.validate(service);
      assert.equal(errors.length, 0, errors);
    });
  });

  describe('"alertTo" field', function () {
    it('should reject invalid emails', function () {
      service.alertTo = 'invalidemail, user@domain.com';
      var errors = serviceValidator.validate(service);
      assert.equal(errors.length, 1, errors);
      assert.equal(errors[0].field, 'alertTo');
    });

    it('should reject empty values', function () {
      service.alertTo = 'admin@domain.com, , user@domain.com';
      var errors = serviceValidator.validate(service);
      assert.equal(errors.length, 1, errors);
      assert.equal(errors[0].field, 'alertTo');
    });

    it('should validate if input is correct', function () {
      service.alertTo = 'admin@domain.com, user@domain.com';
      var errors = serviceValidator.validate(service);
      assert.equal(errors.length, 0, errors);
    });
  });

  function checkNonEmpty(field) {
    delete service[field];
    var errors = serviceValidator.validate(service);
    assert.equal(errors.length, 1, errors);
    assert.equal(errors[0].field, field);
  }

  function checkIntField(val, field) {
    service[field] = val;
    var errors = serviceValidator.validate(service);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].field, field);
  }
});
