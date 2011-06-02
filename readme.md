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


Want to help?  here are some ideas to enhance this

1.  Add the ability to select which 'columns' you want to see
2.  Get smarter about how long a time series to pull down -- only pull down newer data
3.  Make a template with interesting data or graphs and share it.

I've submitted this to google to include int he script gallery so it might get easier eventually.

Enjoy and let me know any suggestions/feedback.

-John
