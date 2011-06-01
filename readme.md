This little script runs in the Gooel App Script environemnt.

Specificlally it runs in googles spreadsheets.  It lets you suck down your fitbit data and the do all kinds of analysis.  It's also an easy way to get started with the fitbit API.

Sadly to get started is a bit of a pain.

1. Create a new google spreadsheet
2. Go to Tools->Script Editor
3. Replace the template with fitbit.js
4. Run the poorly named 'renderFitbitConfigurationDialog' and enter your consumer key and secret.  You may need to run this twice as the first time it will ask you to authorize the script.
5. enter your credentials
6. Run the "Authorize" script -- this will run through the oauth dance.
7. Run the 'refreshTimeSeries" script to get your data
8. Profit!

I've submitted this to google to include int he script gallery so it might get easier eventually.

Enjoy and let me know any suggestions/feedback.

-John
