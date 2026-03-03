import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

export const getAuthUrl = (dentistId) => {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
        ],
        state: dentistId.toString(),
        prompt: 'consent', // Force consent screen to get refresh token
    });
};

export const getTokens = async (code) => {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
};

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
        console.error('Error creating Google Calendar eventDetails:', JSON.stringify(eventDetails));
        console.error('Error creating Google Calendar event:', error.response?.data || error);
        throw error;
    }
};

export const getBusyPeriods = async (tokens, timeMin, timeMax) => {
    try {
        oauth2Client.setCredentials(tokens);
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const res = await calendar.freebusy.query({
            requestBody: {
                timeMin,
                timeMax,
                items: [{ id: 'primary' }],
            },
        });

        return res.data.calendars.primary.busy || [];
    } catch (error) {
        console.error('Error checking Google Calendar freebusy:', error);
        return [];
    }
};
