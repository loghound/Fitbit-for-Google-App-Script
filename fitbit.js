// This script will pull down your fitbit data
// and push it into a spreadsheet
// Units are metric (kg, km) unless otherwise noted
// Suggestions/comments/improvements?  Let me know loghound@gmail.com
//
/**
 * Key of ScriptProperty for Firtbit consumer key.
 * @type {String}
 * @const
 */
var CONSUMER_KEY_PROPERTY_NAME = "fitbitConsumerKey";

/**
 * Key of ScriptProperty for Fitbit consumer secret.
 * @type {String}
 * @const
 */
var CONSUMER_SECRET_PROPERTY_NAME = "fitbitConsumerSecret";

/**
 * Default loggable resources.
 * @type String[]
 * @const
 */
var LOGGABLES = ["activities/log/steps",
                 "activities/log/distance",
                 "activities/log/activeScore",
                 "activities/log/calories",
                 "foods/log/caloriesIn",
                 "activities/log/minutesSedentary",
                 "activities/log/minutesLightlyActive",
                 "activities/log/minutesFairlyActive",
                 "activities/log/minutesVeryActive",
                 "sleep/timeInBed",
                 "sleep/minutesAsleep",
                 "sleep/awakeningsCount"
                 ];


function refreshTimeSeries() {
    // if the user has never configured ask him to do it here
    if (!isConfigured()) {
        renderFitbitConfigurationDialog();
        return;
    }

    var user = authorize();
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    doc.setFrozenRows(2);
    // header rows
    doc.getRange("a1").setValue(user.fullName);
    doc.getRange("a1").setComment("DOB:" + user.dateOfBirth);
    doc.getRange("b1").setValue(user.country + "/" + user.state + "/" + user.city);
    // add the loggables for the last update
    doc.getRange("c1").setValue("Loggables:");
    doc.getRange("c1").setComment(getLoggables());
    // period for the last update
    doc.getRange("d1").setValue("Period: " + getPeriod());

    var options =
    {
        "oAuthServiceName": "fitbit",
        "oAuthUseToken": "always",
        "method": "GET"
    };

    // get inspired here http://wiki.fitbit.com/display/API/API-Get-Time-Series
    var activities = getLoggables();
    for (var activity in activities) {
        var dateString = Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd");
        dateString = "today";
        var currentActivity = activities[activity];
        try {
            var result = UrlFetchApp.fetch("http://api.fitbit.com/1/user/-/" + currentActivity + "/date/" + dateString
            + "/" + getPeriod() + ".json", options);
            //
        } catch(exception) {
            Logger.log(exception);
        }
        var o = Utilities.jsonParse(result.getContentText());

        var cell = doc.getRange('a3');
        var titleCell = doc.getRange("a2");
        titleCell.setValue("Date");
        var title = currentActivity.split("/");
        title = title[title.length - 1];
        titleCell.offset(0, 1 + activity * 1.0).setValue(title);
        var index = 0;

        for (var i in o) {
            var row = o[i];

            for (var j in row) {
                var val = row[j];
                var col = 0;
                cell.offset(index, 0).setValue(val["dateTime"]);
                // set the date index
                cell.offset(index, 1 + activity * 1.0).setValue(val["value"]);
                // set the value index index
                index++;
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
    var key = ScriptProperties.getProperty(CONSUMER_KEY_PROPERTY_NAME);
    if (key == null) {
        key = "";
    }
    return key;
}

/**
 * @param String OAuth consumer key to use when tweeting.
 */
function setConsumerKey(key) {
    ScriptProperties.setProperty(CONSUMER_KEY_PROPERTY_NAME, key);
}

/**
 * @param Array of String for loggable resources, i.e. "foods/log/caloriesIn"
 */
function setLoggables(loggable) {
    ScriptProperties.setProperty("loggables", loggable);
}
/**
 * Returns the loggable resources as String[]
 * @return String[] loggable resources
 */
function getLoggables() {
    var loggable = ScriptProperties.getProperty("loggables");
    if (loggable == null) {
        loggable = LOGGABLES;
    } else {
      loggable = loggable.split(',');
    }
    return loggable;
}

function setPeriod(period) {
    ScriptProperties.setProperty("period", period);
}

function getPeriod() {
    var period = ScriptProperties.getProperty("period");
    if(period == null) {
        period = "30d";
    }
    return period;
}

/**
 * @return String OAuth consumer secret to use when tweeting.
 */
function getConsumerSecret() {
    var secret = ScriptProperties.getProperty(CONSUMER_SECRET_PROPERTY_NAME);
    if (secret == null) {
        secret = "";
    }
    return secret;
}

/**
 * @param String OAuth consumer secret to use when tweeting.
 */
function setConsumerSecret(secret) {
    ScriptProperties.setProperty(CONSUMER_SECRET_PROPERTY_NAME, secret);
}

/** Retrieve config params from the UI and store them. */
function saveConfiguration(e) {
    setConsumerKey(e.parameter.consumerKey);
    setConsumerSecret(e.parameter.consumerSecret);
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
    var app = UiApp.createApplication().setTitle(
    "Configure Fitbit");
    app.setStyleAttribute("padding", "10px");

    var helpLabel = app.createLabel(
    "From here you will configure access to fitbit -- Just supply your own"
    + "consumer key and secret \n\n"
    + "Important:  To authroize this app you need to load the script in the script editor"
    + " (tools->Script Manager) and then run the 'authorize' script.");
    helpLabel.setStyleAttribute("text-align", "justify");
    helpLabel.setWidth("95%");
    var consumerKeyLabel = app.createLabel(
    "Fitbit OAuth Consumer Key:");
    var consumerKey = app.createTextBox();
    consumerKey.setName("consumerKey");
    consumerKey.setWidth("100%");
    consumerKey.setText(getConsumerKey());
    var consumerSecretLabel = app.createLabel(
    "Fitbit OAuth Consumer Secret:");
    var consumerSecret = app.createTextBox();
    consumerSecret.setName("consumerSecret");
    consumerSecret.setWidth("100%");
    consumerSecret.setText(getConsumerSecret());

    var saveHandler = app.createServerClickHandler("saveConfiguration");
    var saveButton = app.createButton("Save Configuration", saveHandler);

    var listPanel = app.createGrid(6, 2);
    listPanel.setWidget(1, 0, consumerKeyLabel);
    listPanel.setWidget(1, 1, consumerKey);
    listPanel.setWidget(2, 0, consumerSecretLabel);
    listPanel.setWidget(2, 1, consumerSecret);
  
    // add checkboxes to select loggables
    var loggables = app.createListBox(true).setId("loggables").setName("loggables");
    loggables.setVisibleItemCount(3);
    for (var resource in LOGGABLES) {
        loggables.addItem(LOGGABLES[resource]);
    }
    listPanel.setWidget(3, 0, app.createLabel("Resources:"));
    listPanel.setWidget(3, 1, loggables);

    var period = app.createListBox(false).setId("period").setName("period");
    period.setVisibleItemCount(1);
    for(var i = 1;i < 31;i++) {
        period.addItem(i + "d");
    }
    period.addItem("max");
    listPanel.setWidget(4, 0, app.createLabel("Period: (in days)"));
    listPanel.setWidget(4, 1, period);

    // Ensure that all form fields get sent along to the handler
    saveHandler.addCallbackElement(listPanel);

    var dialogPanel = app.createFlowPanel();
    dialogPanel.add(helpLabel);
    dialogPanel.add(listPanel);
    dialogPanel.add(saveButton);
    app.add(dialogPanel);
    doc.show(app);
}

function authorize() {
    var oAuthConfig = UrlFetchApp.addOAuthService("fitbit");
    oAuthConfig.setAccessTokenUrl("http://api.fitbit.com/oauth/access_token");
    oAuthConfig.setRequestTokenUrl("http://api.fitbit.com/oauth/request_token");
    oAuthConfig.setAuthorizationUrl("http://api.fitbit.com/oauth/authorize");
    oAuthConfig.setConsumerKey(getConsumerKey());
    oAuthConfig.setConsumerSecret(getConsumerSecret());

    var options =
    {
        "oAuthServiceName": "fitbit",
        "oAuthUseToken": "always"
    };

    // get The profile but don't do anything with it -- just to force authentication
    var result = UrlFetchApp.fetch("http://api.fitbit.com/1/user/-/profile.json", options);
    var o = Utilities.jsonParse(result.getContentText());

    return o.user;
    // options are dateOfBirth, nickname, state, city, fullName, etc.  see http://wiki.fitbit.com/display/API/API-Get-User-Info
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
    }];
    ss.addMenu("Fitbit", menuEntries);
}

function onInstall() {
    onOpen();
    // put the menu when script is installed
}
