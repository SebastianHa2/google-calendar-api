const fs = require('fs');
const { google } = require('googleapis');
const express = require('express')
const path = require('path')

const app = express()

app.use(express.json())
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs')

app.get('/', (req, res, next) => {
    res.render('index')
})

app.get('/show-events', (req, res, next) => {
    const key = req.query.code

        // If modifying these scopes, delete token.json.
    const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
    // The file token.json stores the user's access and refresh tokens, and is
    // created automatically when the authorization flow completes for the first
    // time.
    const TOKEN_PATH = 'token.json';

    // Load client secrets from a local file.
    fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Calendar API.
    authorize(JSON.parse(content), listEvents);
    });

    /**
     * Create an OAuth2 client with the given credentials, and then execute the
     * given callback function.
     * @param {Object} credentials The authorization client credentials.
     * @param {function} callback The callback to call with the authorized client.
     */
    function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
    }

    /**
     * Get and store new token after prompting for user authorization, and then
     * execute the given callback with the authorized OAuth2 client.
     * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
     * @param {getEventsCallback} callback The callback for the authorized client.
     */
    function getAccessToken(oAuth2Client, callback) {


        oAuth2Client.getToken(key, (err, token) => {
            if (err) return res.redirect('/');
            oAuth2Client.setCredentials(token);
            callback(oAuth2Client);
        });
        }

        /**
         * Lists the next 10 events on the user's primary calendar.
         * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
         */
        let events

        function listEvents(auth) {
        const calendar = google.calendar({version: 'v3', auth});
        calendar.events.list({
            calendarId: 'primary',
            timeMin: (new Date()).toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        }, (err, response) => {
            if (err) return console.log('The API returned an error: ' + err);
            events = response.data.items;

            // Remove duplicate dates from the dates for UI purposes
            const dates = events.map(event => {
                return event.start.dateTime.split('T')[0]
            })
            
            const uniqueDates = [...new Set(dates)]

            // Add days to the dates
            let datesWithDays = uniqueDates.map(date => {
                const dt = new Date(date)
                const day = dt.getDay()
                return {
                    date: date,
                    day: day
                }
            })

            // Convert day numbers to names
            datesWithDays = datesWithDays.map(date => {
                if(date.day === 1){
                    return {
                        date: date.date,
                        day: 'Monday'
                    }
                }
                if(date.day === 2){
                    return {
                        date: date.date,
                        day: 'Tuesday'
                    }
                }
                if(date.day === 3){
                    return {
                        date: date.date,
                        day: 'Wednesday'
                    }
                }
                if(date.day === 4){
                    return {
                        date: date.date,
                        day: 'Thursday'
                    }
                }
                if(date.day === 5){
                    return {
                        date: date.date,
                        day: 'Friday'
                    }
                }
                if(date.day === 6){
                    return {
                        date: date.date,
                        day: 'Saturday'
                    }
                }
                if(date.day === 0){
                    return {
                        date: date.date,
                        day: 'Sunday'
                    }
                }
            })

            res.render('events', {
                events: events,
                datesWithDays: datesWithDays
            })
        });
    }
})


const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

