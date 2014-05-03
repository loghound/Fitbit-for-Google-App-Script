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


function refreshTimeSeries() {

    // if the user has never configured ask him to do it here
    if (!isConfigured()) {
        renderFitbitConfigurationDialog();
        return;
    }

    var user = authorize();
    var doc = SpreadsheetApp.getActiveSpreadsheet();

    var options =
    {
        "oAuthServiceName": "fitbit",
        "oAuthUseToken": "always",
        "method": "GET",
    };

    // get inspired here http://wiki.fitbit.com/display/API/API-Get-Time-Series
    var activities = ["foods/log/caloriesIn", "foods/log/water", "activities/calories", "activities/caloriesBMR", "activities/steps", 
"activities/distance", "activities/floors", "activities/elevation", "activities/minutesSedentary", "activities/minutesLightlyActive", 
"activities/minutesFairlyActive", "activities/minutesVeryActive", "activities/activityCalories", "activities/tracker/calories", "activities/tracker/steps", 
"activities/tracker/distance", "activities/tracker/floors", "activities/tracker/elevation", "activities/tracker/minutesSedentary", 
"activities/tracker/minutesLightlyActive", "activities/tracker/minutesFairlyActive", "activities/tracker/minutesVeryActive", 
"activities/tracker/activityCalories", "sleep/startTime", "sleep/timeInBed", "sleep/minutesAsleep", "sleep/awakeningsCount", "sleep/minutesAwake", 
"sleep/minutesToFallAsleep", "sleep/minutesAfterWakeup", "sleep/efficiency", "body/weight", "body/bmi", "body/fat"]
    for (var activity in activities) {
        var dateString = Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd");
        dateString = "today";
        var currentActivity = activities[activity];
        try {
            var result = UrlFetchApp.fetch("http://api.fitbit.com/1/user/-/" + currentActivity + "/date/" + dateString
            + "/" + period + ".json", options);
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

    var listPanel = app.createGrid(4, 2);
    listPanel.setStyleAttribute("margin-top", "10px")
    listPanel.setWidth("90%");
    listPanel.setWidget(1, 0, consumerKeyLabel);
    listPanel.setWidget(1, 1, consumerKey);
    listPanel.setWidget(2, 0, consumerSecretLabel);
    listPanel.setWidget(2, 1, consumerSecret);

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
        "oAuthUseToken": "always",
    };

    // get The profile but don't do anything with it -- just to force authentication
    var result = UrlFetchApp.fetch("http://api.fitbit.com/1/user/-/profile.json", options);
    //
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
