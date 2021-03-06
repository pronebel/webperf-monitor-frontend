'use strict';

/*global configFilePath */

var SETTINGS_FILENAME = 'settings.json';
var DEFAULT_DB_NAME = 'WebPerfMonitor';
var DEFAULT_PORT_NUMBER = 3306;

var RunsModel = require('./../model/runs-model.js');
var fs = require('fs');

exports.getIndexRequest = function(req, res) {
  var config;
  try {
    config = require('../' + GLOBAL.configFile);
  } catch (exception) {}
  if (!config) {
    exports.getSettingsRequest(req, res, true);
    return;
  }

  RunsModel.getLatestCompleteRun()
    .then(function(result) {
      // jscs:disable
      var runId = result['run_id'];
      // jscs:enable
      getTopResultsForRun(runId, 3, function(err, topPagesResults) {
        if (err) {
          console.error(err);
          res.status(500).send('Something broke! ' + err);
          return;
        }

        getWorstResultsForRun(runId, 3, function(err, worstPagesResults) {
          if (err) {
            console.error(err);
            res.status(500).send('Something broke! ' + err);
            return;
          }

          getPreviousScoreAverages(function(err, scoreAverages) {
            if (err) {
              console.error(err);
              res.status(500).send('Something broke! ' + err);
              return;
            }

            getBiggestPagesByTotalResources(runId, 3,
                function(err, biggestTotalResourcePages) {
                  if (err) {
                    console.error(err);
                    res.status(500).send('Something broke! ' + err);
                    return;
                  }

                  res.render('home', {
                    cssfile: 'styles/home.css',
                    topSites: topPagesResults,
                    worstSites: worstPagesResults,
                    scoreAverages: scoreAverages,
                    biggestTotalResourcePages: biggestTotalResourcePages
                  });
                });
          });
        });
      });
    })
    .catch(function(err) {
      console.error(err);
      res.status(500).send('Something broke! ' + err);
    });
};

exports.getSettingsRequest = function(req, res, isIndexPage) {
  // TODO: Better way to show intro message?
  var message = null;
  if (isIndexPage) {
    message = 'You\'ll need to set-up your database settings ';
    message += 'before anything can start working.';
  }

  var settings = {};
  if (fs.existsSync(SETTINGS_FILENAME)) {
    settings = JSON.parse(fs.readFileSync(SETTINGS_FILENAME));
  }

  console.log(JSON.stringify(settings));

  res.render('settings', {
    cssfile: 'styles/settings.css',
    message: message,
    databaseHostname: settings.databaseHostname || '',
    databasePortNum: settings.databasePortNum || DEFAULT_PORT_NUMBER,
    databaseUsername: settings.databaseUsername || '',
    databasePassword: settings.databasePassword || '',
    databaseName: settings.databaseName || DEFAULT_DB_NAME,
    sitemapUrl: settings.sitemapUrl || '',
    webpagetestAPIKey: settings.webpagetestAPIKey || ''
  });
};

exports.getSettingsSubmitRequest = function(req, res) {
  var params = req.body;
  if (!params) {
    res.redirect('/');
  }

  fs.writeFileSync(SETTINGS_FILENAME, JSON.stringify(params));

  if (!params.databaseName) {
    params.databaseName = DEFAULT_DB_NAME;
  }

  if (typeof(params.databasePortNum) === 'undefined' ||
    params.databasePortNum === null) {
    params.databasePortNum = DEFAULT_PORT_NUMBER;
  }

  var fieldErrors = validateFormResults(params);
  if (fieldErrors) {
    res.redirect('/');
  }

  res.redirect('/');
};

function validateFormResults(params) {
  var fieldErrors = [];
  if (!isValidFormTest(params.databaseHostname)) {
    fieldErrors.push({
      errorKey: 'databaseHostname',
      errorMsg: 'You need to supply a Database hostname'
    });
  }

  if (!isValidFormTest(params.databaseUsername)) {
    fieldErrors.push({
      errorKey: 'databaseUsername',
      errorMsg: 'You need to supply a Database username'
    });
  }

  if (!isValidFormTest(params.databasePassword)) {
    fieldErrors.push({
      errorKey: 'databasePassword',
      errorMsg: 'You need to supply a Database password'
    });
  }

  if (!isValidFormTest(params.sitemapUrl)) {
    fieldErrors.push({
      errorKey: 'sitemapUrl',
      errorMsg: 'You need to supply a sitemap URL'
    });
  }

  return fieldErrors;
}

function isValidFormTest(field) {
  if (field === null || typeof(field) === 'undefined') {
    return false;
  }

  return field.length > 0;
}

function getTopResultsForRun(runId, numOfResults, cb) {
  if (!cb) {
    return;
  }

  numOfResults = numOfResults || 10;
  RunsModel.getTopResultsForRun(runId, numOfResults)
    .then(function(result) {
      cb(null, result);
    })
    .catch(function(err) {
      cb(err);
    });
}

function getWorstResultsForRun(runId, numOfResults, cb) {
  if (!cb) {
    return;
  }

  numOfResults = numOfResults || 10;
  RunsModel.getWorstResultsForRun(runId, numOfResults)
    .then(function(result) {
      cb(null, result);
    })
    .catch(function(err) {
      cb(err);
    });
}

function getPreviousScoreAverages(cb) {
  if (!cb) {
    return;
  }
  var numberOfDays = 30 * 3;
  RunsModel.getPreviousScoreAverages(numberOfDays)
    .then(function(result) {
      cb(null, result);
    })
    .catch(function(err) {
      cb(err);
    });
}

function getBiggestPagesByTotalResources(runId, numOfResults, cb) {
  if (!cb) {
    return;
  }

  numOfResults = numOfResults || 10;
  RunsModel.getBiggestPagesByTotalResources(runId, numOfResults)
    .then(function(result) {
      cb(null, result);
    })
    .catch(function(err) {
      cb(err);
    });
}
