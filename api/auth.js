export default function handler(req, res) {
    const clientId = process.env.OAUTH_CLIENT_ID;

    if (!clientId) {
        return res.status(500).send('OAuth Client ID not configured in environment variables.');
    }

    const host = req.headers.host;
    const protocol = host.includes('localhost') ? 'http' : 'https';

    const url = new URL('https://github.com/login/oauth/authorize');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', `${protocol}://${host}/api/callback`);
    url.searchParams.set('scope', 'repo,user');

    res.redirect(url.toString());
}
