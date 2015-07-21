This little script (developed originally by [loghound][1]) runs in the Google App Script environment.

Specifically it runs in [Google Spreadsheets][0]. It lets you suck down your Fitbit data and the do all kinds of analysis.  It's also an easy way to get started with the Fitbit API.

Sadly to get started is a bit of a pain:

1. Create a new Google Spreadsheet.
2. Go to Tools-->Script Editor
3. Replace the template with fitbit.js & reload the spreadsheet
4. From the Fitbit menu that should appear, run the Configure option
5. Follow all the instructions given in the form that pops up
6. Run the "Authorize" menu option -- this will run through the oauth dance.
7. Run the 'Refresh fitbit Time Data" menu option to get your data
8. Profit!

[0]: http://drive.google.com
[1]: https://github.com/loghound/Fitbit-for-Google-App-Script
