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
    reporter.getServices(req.query, function (err, serviceReports){
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
