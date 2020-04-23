var fs = require('fs');
var async = require('async');
var colors = require('colors');
var program = require('commander');
var pluginLoader = require('../lib/plugin-loader');
var storageFactory = require('../lib/storage/storage-factory');
var WatchMenFactory = require('../lib/watchmen');
var sentinelFactory = require('../lib/sentinel');
var serviceValidator = require('../lib/service-validator');

var RETURN_CODES = {
    OK: 0,
    BAD_STORAGE: 1,
    GENERIC_ERROR: 2
};

function exit(code) {
    process.exit(code);
}

program
    .option('-e, --env [env]', 'Storage environment key', process.env.NODE_ENV || 'development')
    .option('-f, --file [value]', 'File to load', 'data.json')
    .parse(process.argv);

var storage = storageFactory.getStorageInstance(program.env);
if (!storage) {
    console.error('Error creating storage for env: ', program.env);
    return process.exit(RETURN_CODES.BAD_STORAGE);
}

// console.log(program.file);

function isIn(element, list, comparator) {
    for (var i = 0; i < list.length; i++) {
        if (comparator(element, list[0])) return true;
    }
    return false;
}

function populate(services, storage, callback){

    if (!services || !services.length) {
        return callback('services not provided');
    }

    function addService(service, cb) {
        var errors = serviceValidator.validate(service);
        if (errors.length === 0){
            storage.addService(service, cb);
        } else {
            cb(errors);
        }
    }
    async.eachSeries(services, addService, function (err) {
        if (err) {
            return callback(err);
        }
        callback();
    });
}

// storage.flush_database(function() { exit(1) });

fs.readFile(__dirname + '/' + program.file, function (err, data) {
    if (err) throw err;

    var newServices = JSON.parse(data.toString());
    storage.getServices({}, function(err, services){
        if (err) throw err;

        var servicesToAdd = [];
        for (var i = 0; i < newServices.length; i++) {
            var newService = newServices[i];
            if (!isIn(newService, services, function(e1, e2) { return e1.name === e2.name })) {
                console.log('Appending ' + newService.name);
                servicesToAdd.push(newService);
                newService.pingServiceOptions = {};
                var options = {};
                newService.pingServiceOptions[newService.pingServiceName] = options;

                if (newService.pingServiceName === 'http-contains') {
                    options['contains'] = {
                        descr : "response body must contain",
                        required : true,
                        value : newService.contains
                    };

                    options['notContains'] = {
                        descr : "response body must NOT contain",
                        required : false,
                        value : newService.notContains
                    };
                    delete newService.notContains;
                    delete newService.contains;
                } else {
                    options['statusCode'] = {
                        descr : "Expected status code (defaults to 200)",
                        required : false,
                        value : newService.statusCode
                    }
                    delete newService.statusCode;

                }
            }
        }

        if (servicesToAdd.length === 0) {
            console.log('No new services');
            exit(RETURN_CODES.OK);
        } else {
            populate(servicesToAdd, storage, function(err) {
                console.log(err);
                if (err) throw err;
                exit(RETURN_CODES.OK);
            })
        }
    });
});

