import { google } from 'googleapis';

// --- AWS PRODUCTION REDIRECT URI ---
// Google is very strict: This must match what you put in the Google Console EXACTLY.
const REDIRECT_URI = 'http://16.170.201.132.nip.io:8000/api/auth/google/callback';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
);

export const getAuthUrl = (dentistId, loginHint = null) => {
    const options = {
        access_type: 'offline', // Required to get the refresh_token
        scope: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
        ],
        state: dentistId.toString(),

        // --- THE FIX FOR ACCOUNT SELECTION ---
        // 'select_account' forces Google to show the account picker.
        // 'consent' ensures we get a fresh refresh_token every time.
        prompt: 'select_account consent',

        // Explicitly pass the redirect_uri to prevent Error 400
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || REDIRECT_URI
    };

    // We REMOVE login_hint here. 
    // If we send login_hint, Google tries to log into that specific account automatically.
    // By removing it, Google is forced to ask "Which account do you want to use?"

    return oauth2Client.generateAuthUrl(options);
};

export const getTokens = async (code) => {
    // The redirect_uri must be provided here to match the one used in getAuthUrl
    const { tokens } = await oauth2Client.getToken({
        code: code,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || REDIRECT_URI
    });
    return tokens;
};

// ... keep your other functions (createEvent, deleteEvent, getBusyPeriods) as they were ...

export const createEvent = async (tokens, eventDetails) => {
    try {
        oauth2Client.setCredentials(tokens);
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const res = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: eventDetails,
        });
        return res.data;
    } catch (error) {
        console.error('Error creating Google Calendar event:', error.response?.data || error);
        throw error;
    }
};

export const deleteEvent = async (tokens, eventId) => {
    try {
        oauth2Client.setCredentials(tokens);
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        await calendar.events.delete({
            calendarId: 'primary',
            eventId: eventId,
        });
        return true;
    } catch (error) {
        console.error('Error deleting Google Calendar event:', error.response?.data || error);
        if (error.code === 404 || error.code === 410) return true;
        throw error;
    }
};

export const updateEvent = async (tokens, eventId, eventDetails) => {
    try {
        oauth2Client.setCredentials(tokens);
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const res = await calendar.events.patch({
            calendarId: 'primary',
            eventId: eventId,
            requestBody: eventDetails,
        });
        return res.data;
    } catch (error) {
        console.error('Error updating Google Calendar event:', error.response?.data || error);
        throw error;
    }
};

export const getBusyPeriods = async (tokens, timeMin, timeMax, timeZone = 'UTC') => {
    try {
        oauth2Client.setCredentials(tokens);
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const res = await calendar.freebusy.query({
            requestBody: {
                timeMin,
                timeMax,
                timeZone,
                items: [{ id: 'primary' }],
            },
        });

        return res.data.calendars.primary.busy || [];
    } catch (error) {
        console.error('Error checking Google Calendar freebusy:', error);
        return [];
    }
};