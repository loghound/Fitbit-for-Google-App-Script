This little script (developed originally by [loghound][1]) runs in the Google App Script environment.

Specifically it runs in [Google Spreadsheets][0].  It lets you suck down your Fitbit data and the do all kinds of analysis.  It's also an easy way to get started with the Fitbit API.

Sadly to get started is a bit of a pain.

1. Create a new Google spreadsheet
2. Go to Tools->Script Editor
3. Replace the template with fitbit.js
4. Run the poorly named 'renderFitbitConfigurationDialog' and enter your consumer key and secret.  You may need to run this twice as the first time it will ask you to authorize the script.
5. enter your credentials
6. Run the "Authorize" script -- this will run through the oauth dance.
7. Run the 'refreshTimeSeries" script to get your data
8. Profit!

[0]: http://docs.google.com
[1]: https://github.com/loghound/Fitbit-for-Google-App-Script
