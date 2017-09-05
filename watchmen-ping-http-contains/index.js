var request = require('request');

function PingService(options){
    if (options && options.dependencies && options.dependencies.request){
        request = options.dependencies.request;
    }
}

exports = module.exports = PingService;

PingService.prototype.ping = function(service, callback){
    var payload = service.pingServiceOptions['http-contains'].payload.value;
    var headersValue = service.pingServiceOptions['http-contains'].headers.value;
    var contains = service.pingServiceOptions['http-contains'].contains.value;
    var notContains = null;
    var expectedStatusCode = 200;

    console.log('Header Values'+headersValue)
    if(!headersValue)
        headersValue = "{\"Cache-Control\": \"no-cache\"}";

    var serviceOptions = (service.pingServiceOptions && service.pingServiceOptions['http-contains']) || {};
    if (serviceOptions.statusCode && serviceOptions.statusCode.value) {
        expectedStatusCode = parseInt(serviceOptions.statusCode.value, 10);
    }

    var options = {
        uri: service.url,
        timeout: service.timeout,
        poll: false
    };

    if (!service.pingServiceOptions || !service.pingServiceOptions['http-contains'] ||
        !service.pingServiceOptions['http-contains'].contains ||
        !service.pingServiceOptions['http-contains'].contains.value) {
        return callback('http-contains plugin configuration is missing');
    }

    function prepareOptions(headersValue){
        if(service.serviceType == 'GET'){
            return {
                url: service.url,
                timeout: service.timeout,
                headers: headersValue,
                method : service.serviceType,
                poll : false
            };
        }else{
            return {
                url: service.url,
                timeout: service.timeout,
                body: payload,
                headers: headersValue,
                method : service.serviceType,
                poll : false
            };
        }
        //return options;
    }

    if (service.pingServiceOptions['http-contains'].notContains){
        notContains = service.pingServiceOptions['http-contains'].notContains.value;
    }

    var startTime = +new Date();

    request(prepareOptions(), function(error, response, body){
        console.log("requestBody :::: " + payload);
        console.log("requestMethod :::: " + prepareOptions().method);
        console.log("Response :::: " + body);
        var elapsedTime = +new Date() - startTime;
        if (error) {
            return callback(error, body, response, elapsedTime);
        }

        if (response && response.statusCode != expectedStatusCode) {
            var errMsg = 'Invalid status code. Found: ' + response.statusCode +
                '. Expected: ' + expectedStatusCode;
            return callback(errMsg, body, response, +new Date() - startTime);
        }

        if (body.indexOf(contains) === -1) {
            return callback(contains + ' not found', body, response, elapsedTime);
        }
        else {
            if (notContains && body.indexOf(notContains) > -1) {
                return callback(notContains + ' found', body, response, elapsedTime);
            }
            callback(null, body, response, elapsedTime);
        }
    });
};


PingService.prototype.getDefaultOptions = function(){
    return {
        'payload': {
            descr: 'payload',
            placeholder: '',
            required : false
        },

        'headers': {
            descr: 'Headers in json format',
            placeholder: '{"Accept":"application/json", "Content-Type":"application/json"}',
            required : false
        },

        'contains': {
            descr: 'response body must contain',
            placeholder: '',
            required: false
        },

        'notContains': {
            descr: 'response body must NOT contain',
            placeholder: '',
            required: false
        },

        'statusCode': {
            descr: 'Expected status code (defaults to 200)',
            required: true
        }

    };
}