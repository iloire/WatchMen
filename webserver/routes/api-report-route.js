var moment = require('moment');
var express = require('express');
var reporterFactory = require('./../../lib/reporter');
var accessFilter = require('./../../lib/service-access-filter');

module.exports.getRoutes = function (storage){

  if (!storage) {
    throw new Error('storage needed');
  }

  var reporter = new reporterFactory(storage);
  var router = express.Router();

  function handlePrivateFields(service) {
    delete service.alertTo;

    service.isRestricted = !!service.restrictedTo;

    delete service.restrictedTo;
    return service;
  }

  /**
   * Get latest service outages.
   */

  router.get('/services/outages', function (req, res) {
    // Creating request options and setting default values when necessary.
    var options = {
      since: req.query.since ? req.query.since : Date.now() - 3600,
      maxItems: req.query['max-items'] ? req.query['max-items'] : 10,
      maxItemsPerService: req.query['max-items-per-service'] ? req.query['max-items-per-service'] : 10,
      grouping: req.query.grouping ? parseInt(req.query.grouping) : 0
    };

    storage.getServices({}, function (err, services) {
      if (err) {
        console.error(err);
        return res.status(500).json({error: err});
      }
      var filteredServices = accessFilter.filterServices(services, req.user);
      storage.getServicesOutagesSince(filteredServices, options, function (err, outages) {
        if(err) {
          console.error(err);
          return res.statusCode(500).json({error: err});
        }
        res.json(outages);
      })
    });
  });

  /**
   * Load service report
   */

  router.get('/services/:id', function(req, res){
    if (!req.params.id) {
      return res.status(400).json({ error: 'ID parameter not found' });
    }
    reporter.getService(req.params.id, function (err, serviceReport){
      if (err) {
        console.error(err);
        return res.status(500).json({ error: err });
      }

      serviceReport = accessFilter.filterReports(serviceReport, req.user);

      if (!serviceReport) {
        return res.status(404).json({ error: 'Service not found' });
      }

      serviceReport.service = handlePrivateFields(serviceReport.service);

      res.json(serviceReport);
    });
  });

  /**
   * Load services report
   */

  router.get('/services', function(req, res){
    reporter.getServices({}, function (err, serviceReports){
      if (err) {
        console.error(err);
        return res.status(500).json({ error: err });
      }
      serviceReports = accessFilter.filterReports(serviceReports, req.user).map(function(s){
        s.service = handlePrivateFields(s.service);
        return s;
      });
      res.json(serviceReports);
    });
  });

  return router;

};
