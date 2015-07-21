// This script will pull down your fitbit data
// and push it into a spreadsheet
// Units are metric (kg, km) unless otherwise noted
// Suggestions/comments/improvements?  Let me know loghound@gmail.com
//
//
/**** Length of time to look at.
 * From fitbit documentation values are
 * 1d, 7d, 30d, 1w, 1m, 3m, 6m, 1y, max.
*/
var period = "1y";

/**
 * Key of ScriptProperty for Fitbit consumer key.
 * @type {String}
 * @const
 */
var CLIENT_ID_PROPERTY_NAME = "fitbitClientID";

/**
 * Key of ScriptProperty for Fitbit consumer secret.
 * @type {String}
 * @const
 */
var CONSUMER_SECRET_PROPERTY_NAME = "fitbitConsumerSecret";

/**
 * Key of Project.
 * @type {String}
 * @const
 */
var PROJECT_KEY_PROPERTY_NAME = "projectKey";


/**
 * Default loggable resources.
 *
 * @type String[]
 * @const
 */
var LOGGABLES = [ "activities/log/steps", "activities/log/distance",
    "activities/log/activeScore", "activities/log/activityCalories",
    "activities/log/calories", "foods/log/caloriesIn",
    "activities/log/minutesSedentary",
    "activities/log/minutesLightlyActive",
    "activities/log/minutesFairlyActive",
    "activities/log/minutesVeryActive", "sleep/timeInBed",
    "sleep/minutesAsleep", "sleep/minutesAwake", "sleep/awakeningsCount",
    "body/weight", "body/bmi", "body/fat" ];

/**
 * Default fetchable periods.
 *
 * @type String[]
 * @const
 */
var PERIODS = [ "1d", "7d", "30d", "1w", "1m", "3m", "6m", "1y", "max" ];

/**
 * Instance of PropertiesService for access to ScriptProperties
 *
 * @type {Object} scriptProperties
 */
var scriptProperties = PropertiesService.getScriptProperties();

function refreshTimeSeries() {

  // if the user has never configured ask him to do it here
  if (!isConfigured()) {
    renderFitbitConfigurationDialog();
    return;
  }

  Logger.log('Refreshing timeseries data...');
  var user = authorize().user;
  Logger.log(user)
  var doc = SpreadsheetApp.getActiveSpreadsheet()
  doc.setFrozenRows(2);
  // header rows
  doc.getRange("a1").setValue(user.displayName);
  doc.getRange("a1").setNote("DOB:" + user.dateOfBirth);
  doc.getRange("b1").setValue(
      user.locale);
  // add the loggables for the last update
  doc.getRange("c1").setValue("Loggables:");
  doc.getRange("c1").setNote(getLoggables());
  // period for the last update
  doc.getRange("d1").setValue("Period: " + getPeriod());
  doc.getRange("e1").setValue("=image(\"" + user.avatar + "\";1)");

  // get inspired here http://wiki.fitbit.com/display/API/API-Get-Time-Series
  var activities = getLoggables();
  for ( var activity in activities) {
    Logger.log('Refreshing ' + activity)
    var dateString = "today";
    var currentActivity = activities[activity];
    try {
      var service = getService();

      var options = {
        "method" : "GET",
        "headers": {
          "Authorization": "Bearer " + service.getAccessToken()
        }
      };

      if (service.hasAccess()) {
        var url = "https://api.fitbit.com/1/user/-/"
          + currentActivity + "/date/" + dateString + "/"
          + getPeriod() + ".json";
        Logger.log(options)
        var result = UrlFetchApp.fetch(url, options);
      }
    } catch (exception) {
      Logger.log(exception);
    }
    Logger.log(result);
    var o = JSON.parse(result.getContentText());

    // set title
    var titleCell = doc.getRange("a2");
    titleCell.setValue("Date");
    var cell = doc.getRange('a3');

    // fill data
    for ( var i in o) {
      // set title for this column
      var title = i.substring(i.lastIndexOf('-') + 1);
      titleCell.offset(0, 1 + activity * 1.0).setValue(title);

      var row = o[i];
      var row_index = 0;
      for ( var j in row) {
        var val = row[j];

        // Convert the date from the API to a real GS date needed for finding the right row.
        var dateParts = val["dateTime"].split("-");
        var date = new Date(dateParts[0], (dateParts[1]-1), dateParts[2], 0, 0, 0, 0);

        // Have we found a row yet? or do we need to look for it?
        if ( row_index != 0 ) {
          row_index++;
        } else {
          row_index = findRow(date);
        }
        // Insert Date into first column
        doc.getActiveSheet().getRange(row_index, 1).setValue(val["dateTime"]);
        // Insert value
        doc.getActiveSheet().getRange(row_index, 2 + activity * 1.0).setValue(Number(val["value"]));
      }
    }
  }
}

function isConfigured() {
    return getConsumerKey() != "" && getConsumerSecret() != "";
}

/**
 * @return String OAuth consumer key to use when tweeting.
 */
function getConsumerKey() {
  var key = scriptProperties.getProperty(CLIENT_ID_PROPERTY_NAME);
  if (key == null) {
    key = "";
  }
  return key;
}

/**
 * @param String OAuth consumer key to use when tweeting.
 */
function setConsumerKey(key) {
  scriptProperties.setProperty(CLIENT_ID_PROPERTY_NAME, key);
}

/**
 * @return String Project key
 */
function getProjectKey() {
  var key = scriptProperties.getProperty(PROJECT_KEY_PROPERTY_NAME);
  if (key == null) {
    key = "";
  }
  return key;
}

/**
 * @param String Project key
 */
function setProjectKey(key) {
  scriptProperties.setProperty(PROJECT_KEY_PROPERTY_NAME, key);
}

/**
 * @param Array
 *      of String for loggable resources, i.e. "foods/log/caloriesIn"
 */
function setLoggables(loggable) {
  scriptProperties.setProperty('loggables', loggable);
}

/**
 * Returns the loggable resources as String[]
 *
 * @return String[] loggable resources
 */
function getLoggables() {
  var loggable = scriptProperties.getProperty('loggables');
  if (loggable == null) {
    loggable = LOGGABLES;
  } else {
    loggable = loggable.split(',');
  }
  return loggable;
}

function setPeriod(period) {
  scriptProperties.setProperty('period', period);
}

function getPeriod() {
  var period = scriptProperties.getProperty('period');
  if (period == null) {
    period = "30d";
  }
  return period;
}

/**
 * @return String OAuth consumer secret to use when tweeting.
 */
function getConsumerSecret() {
  var secret = scriptProperties.getProperty(CONSUMER_SECRET_PROPERTY_NAME);
  if (secret == null) {
    secret = "";
  }
  return secret;
}

/**
 * @param String OAuth consumer secret to use when tweeting.
 */
function setConsumerSecret(secret) {
  scriptProperties.setProperty(CONSUMER_SECRET_PROPERTY_NAME, secret);
}

/** Retrieve config params from the UI and store them. */
function saveConfiguration(e) {

    setConsumerKey(e.parameter.clientID);
    setConsumerSecret(e.parameter.consumerSecret);
    setProjectKey(e.parameter.projectKey);
    setLoggables(e.parameter.loggables);
    setPeriod(e.parameter.period);
    var app = UiApp.getActiveApplication();
    app.close();
    return app;
}
/**
 * Configure all UI components and display a dialog to allow the user to
 * configure approvers.
 */
function renderFitbitConfigurationDialog() {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var app = UiApp.createApplication().setTitle("Configure Fitbit");
  app.setStyleAttribute("padding", "10px");
  app.setHeight('380');

  var helpLabel = app
       .createLabel("From here you will configure access to fitbit -- Just supply your own"
           + "client id and secret from dev.fitbit.com.  "
           + " You can find the project key by loading the script in the script editor"
           + " (tools->Script Editor..) and opening the project properties (file->Project properties). \n\n"
           + " While in the script editor, you also need to add the OAuth2 library following these instructions: https://github.com/googlesamples/apps-script-oauth2/tree/0e7bcd464962321a75ccb97256d5373b27c4c2e1#setup. \n\n"
           + " You also need to setup your Redirect URI at fitbit, substituting in your project key you just found and "
           + "using the instructions here: https://github.com/googlesamples/apps-script-oauth2/tree/0e7bcd464962321a75ccb97256d5373b27c4c2e1#redirect-uri \n\n"
           + "Important:  To authorize this app you need to run 'Authorize' from the fitbit menu.");
  helpLabel.setStyleAttribute("text-align", "justify");
  helpLabel.setWidth("95%");
  var consumerKeyLabel = app.createLabel("Fitbit OAuth 2.0 Client ID:");
  var consumerKey = app.createTextBox();
  consumerKey.setName("clientID");
  consumerKey.setWidth("100%");
  consumerKey.setText(getConsumerKey());
  var consumerSecretLabel = app.createLabel("Fitbit OAuth Client (Consumer) Secret:");
  var consumerSecret = app.createTextBox();
  consumerSecret.setName("consumerSecret");
  consumerSecret.setWidth("100%");
  consumerSecret.setText(getConsumerSecret());
  var projectKeyLabel = app.createLabel("Project Key:");
  var projectKey = app.createTextBox();
  projectKey.setName("projectKey");
  projectKey.setWidth("100%");
  projectKey.setText(getProjectKey());

  var saveHandler = app.createServerClickHandler("saveConfiguration");
  var saveButton = app.createButton("Save Configuration", saveHandler);

  var listPanel = app.createGrid(6, 3);
  listPanel.setWidget(1, 0, consumerKeyLabel);
  listPanel.setWidget(1, 1, consumerKey);
  listPanel.setWidget(2, 0, consumerSecretLabel);
  listPanel.setWidget(2, 1, consumerSecret);
  listPanel.setWidget(3, 0, projectKeyLabel);
  listPanel.setWidget(3, 1, projectKey);

  // add checkboxes to select loggables
  var loggables = app.createListBox(true).setId("loggables").setName("loggables");
  loggables.setVisibleItemCount(3);
  var current_loggables = getLoggables();
  for ( var resource in LOGGABLES) {
    loggables.addItem(LOGGABLES[resource]);
    if (current_loggables.indexOf(LOGGABLES[resource]) > -1) {
			loggables.setItemSelected(parseInt(resource), true);
		}
  }
  listPanel.setWidget(4, 0, app.createLabel("Resources:"));
  listPanel.setWidget(4, 1, loggables);

  var period = app.createListBox(false).setId("period").setName("period");
  period.setVisibleItemCount(1);
  // add valid timeperiods
  for ( var resource in PERIODS) {
    period.addItem(PERIODS[resource]);
  }
  period.setSelectedIndex(PERIODS.indexOf(getPeriod()));
  listPanel.setWidget(5, 0, app.createLabel("Period:"));
  listPanel.setWidget(5, 1, period);

  // Ensure that all form fields get sent along to the handler
  saveHandler.addCallbackElement(listPanel);

  var dialogPanel = app.createFlowPanel();
  dialogPanel.add(helpLabel);
  dialogPanel.add(listPanel);
  dialogPanel.add(saveButton);
  app.add(dialogPanel);
  doc.show(app);
}

function getService() {
  //Implement updated OAuth 2 support
  //When using new OAuth1 library, callback URL length is too long, therefore doesn't work:
  // https://github.com/googlesamples/apps-script-oauth1/issues/8
  //
  //Fitbit API:
  //https://wiki.fitbit.com/display/API/OAuth+2.0
  //Google App Script OAuth2 instructions:
  //https://github.com/googlesamples/apps-script-oauth2

  //modified from : https://github.com/googlesamples/apps-script-oauth1/issues/8#issuecomment-100309694

  return OAuth2.createService('fitbit')
      .setAuthorizationBaseUrl('https://www.fitbit.com/oauth2/authorize')
      .setTokenUrl('https://api.fitbit.com/oauth2/token')
      .setClientId(getConsumerKey())
      .setClientSecret(getConsumerSecret())
      .setProjectKey(getProjectKey())
      .setCallbackFunction('fitbitAuthCallback')
      .setPropertyStore(PropertiesService.getScriptProperties())
      .setScope('activity')
      .setTokenHeaders({
        'Authorization': 'Basic ' + Utilities.base64Encode(getConsumerKey() + ':' + getConsumerSecret())
      });

}

function authorize() {
  var service = getService()

  if (service.hasAccess()) {
    var url = 'https://api.fitbit.com/1/user/-/profile.json';
       var response = UrlFetchApp.fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + service.getAccessToken()
      }
    });
    Logger.log(JSON.stringify(JSON.parse(response.getContentText()), null, 2));
    return JSON.parse(response.getContentText())
  } else {
    var authorizationUrl = service.getAuthorizationUrl();
    var template = HtmlService.createTemplate(
        '<a href="<?= authorizationUrl ?>" target="_blank">Authorize</a>. ' +
        'Reopen the sidebar when the authorization is complete.');
    template.authorizationUrl = authorizationUrl;
    var page = template.evaluate();
    SpreadsheetApp.getUi().showSidebar(page);
  }
}

// modified from: https://github.com/googlesamples/apps-script-oauth1/tree/9d074adc735e35c8966bcfa30114c205d69ab44e#3-handle-the-callback
function fitbitAuthCallback(request) {
  var service = getService();
  var isAuthorized = service.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('Success! You can close this page.');
  } else {
    return HtmlService.createHtmlOutput('Denied. You can close this page');
  }
}

/** When the spreadsheet is opened, add a Fitbit menu. */
function onOpen() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var menuEntries = [{
        name: "Refresh fitbit Time Data",
        functionName: "refreshTimeSeries"
    },
    {
        name: "Configure",
        functionName: "renderFitbitConfigurationDialog"
    },
    {
        name: "Authorize",
        functionName: "authorize"
    }];
    ss.addMenu("Fitbit", menuEntries);
}

function onInstall() {
    onOpen();
    // put the menu when script is installed
}

// Find the right row for a date.
function findRow(date) {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var cell = doc.getRange("A3");

  // Find the first cell in first column which is either empty,
  // or has an equal or bigger date than the one we are looking for.
  while ((cell.getValue() != "") && (cell.getValue() < date)) {
    cell = cell.offset(1,0);
  }
  // If the cell we found has a newer date than ours, we need to
  // insert a new row right before that.
  if (cell.getValue() > date) {
    doc.insertRowBefore(cell.getRow())
  }
  // return only the number of the row.
  return (cell.getRow());
}
