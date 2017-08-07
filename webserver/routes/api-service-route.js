var express = require('express');
var serviceValidator = require('./../../lib/service-validator');
var accessFilter = require('./../../lib/service-access-filter');
var config = require('../../config/web');

module.exports.getRoutes = function (storage) {

  if (!storage) {
    throw new Error('storage needed');
  }

  var router = express.Router();

  var requireAdmin = function (req, res, next) {
    if ((req.user && req.user.isAdmin) || config.no_auth) {
      next();
    } else {
      return res.status(401).json({error: 'auth required'});
    }
  };

  /**
   * Add service
   */

  router.post('/services', requireAdmin, function (req, res) {
    var service = req.body;

    var errors = serviceValidator.validate(service);
    if (errors.length) {
      return res.status(400).json({errors: errors});
    }
    storage.addService(service, function (err, id) {
      if (err) {
        return res.status(500).json({error: err});
      }
      return res.status(200).json({id: id});
    });
  });

  /**
   * Delete service
   */

  router.delete('/services/:id', requireAdmin, function (req, res) {
    var id = req.params.id;
    if (!id) {
      return res.status(404).json({error: 'ID parameter not found'});
    }
    storage.getService(id, function (err, service) {
      if (err) {
        return res.status(500).json({error: err});
      }

      if (!service) {
        return res.status(404).json({error: 'service not found'});
      }

      storage.deleteService(id, function (err) {
        if (err) {
          return res.status(500).json({error: err});
        }
        return res.json({id: id});
      });
    });
  });

  /**
   * Update service
   */

  router.post('/services/:id', requireAdmin, function (req, res) {

    var id = req.params.id;
    if (!id) {
      return res.status(404).json({error: 'ID parameter not found'});
    }

    var errors = serviceValidator.validate(req.body);
    if (errors.length) {
      return res.status(400).json({errors: errors});
    }

    storage.getService(id, function (err, existingService) {
      if (err) {
        return res.status(500).json({error: err});
      }

      if (!existingService) {
        return res.status(404).json({error: 'service not found'});
      }

      storage.updateService(req.body, function (err, service) {
        if (err) {
          return res.status(500).json({error: err});
        }
        return res.json(service);
      });
    });
  });


  /**
   * Reset service data
   */

  router.post('/services/:id/reset', requireAdmin, function (req, res) {
    var id = req.params.id;
    if (!id) {
      return res.status(404).json({error: 'ID parameter not found'});
    }
    storage.getService(id, function (err, service) {
      if (err) {
        return res.status(500).json({error: err});
      }

      if (!service) {
        return res.status(404).json({error: 'service not found'});
      }

      storage.resetService(id, function (err) {
        if (err) {
          return res.status(500).json({error: err});
        }
        return res.json({id: id});
      });
    });
  });

  /**
   * Load service
   */

  router.get('/services/:id', requireAdmin, function (req, res) {
    if (!req.params.id) {
      return res.status(404).json({error: 'ID parameter not found'});
    }
    storage.getService(req.params.id, function (err, service) {
      if (err) {
        console.error(err);
        return res.status(500).json({error: err});
      }

      service = accessFilter.filterServices(service, req.user);

      if (!service) {
        return res.status(404).json({error: 'Service not found'});
      }
      res.json(service);
    });
  });

  /**
   * Load services
   */

  router.get('/services', requireAdmin, function (req, res) {
    storage.getServices({}, function (err, services) {
      if (err) {
        console.error(err);
        return res.status(500).json({error: err});
      }
      // for small number of services (hundreds) we can go away with post database query filtering.
      // if you are managing thousands of services you may to index users/services for better performance
      res.json(accessFilter.filterServices(services, req.user));
    });
  });

  /**
   * Load tags
   *
   */
  router.get('/tags', requireAdmin, function (req, res) {
      storage.getTags(function (err, tags) {
          if (err) {
              console.error(err);
              return res.status(500).json({error: err});
          }
          res.json(tags);
      });
  });

  return router;
};
