var validator = require('validator');

exports = module.exports = (function(){

  function validateOptionalInt(service, errors, field, options) {
    if (service[field]){
      validateInt(service, errors, field, options);
    }
  }

  function validateInt(service, errors, field, options) {
    //coerce to be string to suppress warnings of validator.js
    if (!validator.isInt(service[field]+ '', options || {})) {
      errors.push({ field: field, error: 'Invalid value for "'+ field + '"'});
    }
  }

  function validateExistence (service, errors, field) {
    if (!service[field]) {
      errors.push({ field: field, error: 'A value is required for field "' + field + '"'});
    }
  }

  function validateOptionalCommaSeparatedEmails(service, errors, field) {
    var fieldValue = service[field];
    if (fieldValue) {
      var emails = fieldValue.split(',').map(function(email){return email.trim();});
      emails.forEach(function(email){
	    //coerce to be string to suppress warnings of validator.js
        if (!validator.isEmail(email+'')) {
          errors.push({ field: field, error: email + ' is not a valid email for field "' + field + '"'});
        }
      });
    }
  }

  return {

    /**
     * Validates service. Returns an array of errors if not valid or null if valid
     * @param service
     * @param cb
     */

    validate: function(service) {
      var errors = [];

      if (service === null || typeof service !== 'object') {
        errors.push({ field: '', error: 'Invalid service object'});
        return errors;
      }

      validateInt(service, errors, 'failureInterval', { min: 500 });
      validateInt(service, errors, 'interval', { min: 500 });
      validateInt(service, errors, 'warningThreshold');
      validateOptionalInt(service, errors, 'failuresToBeOutage', { min: 1 });
      validateInt(service, errors, 'port', { min: 0 });
      validateInt(service, errors, 'timeout', { min: 0 });
      validateExistence(service, errors, 'pingServiceName');
      validateExistence(service, errors, 'name');
      validateExistence(service, errors, 'url');

      validateOptionalCommaSeparatedEmails(service, errors, 'restrictedTo');
      validateOptionalCommaSeparatedEmails(service, errors, 'alertTo');

      return errors;
    }

  };

})();