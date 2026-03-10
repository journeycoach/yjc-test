export default async function handler(req, res) {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send('No Authorization Code provided from GitHub.');
    }

    try {
        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                client_id: process.env.OAUTH_CLIENT_ID,
                client_secret: process.env.OAUTH_CLIENT_SECRET,
                code,
            }),
        });

        const data = await response.json();
        const token = data.access_token;

        if (!token) {
            return res.status(400).send('Failed to fetch access token: ' + JSON.stringify(data));
        }

        // Decap CMS postMessage communication bridge
        const script = `
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Login Successful</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f9fafb; color: #111827; }
        .card { background: white; padding: 2rem 3rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: center; }
        h1 { font-size: 1.5rem; margin-bottom: 1rem; color: #10b981; }
        p { color: #6b7280; margin-bottom: 1.5rem; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Authentication Successful!</h1>
        <p>You can close this window and return to your journey coach admin page.</p>
        <button onclick="window.close()" style="padding: 0.5rem 1rem; background: #111827; color: white; border: none; border-radius: 4px; cursor: pointer;">Close Window</button>
      </div>

      <script>
        // Send the authorization success message directly to the CMS parent window
        console.log("Sending token directly to CMS");
        
        // Calculate the origin dynamically based on the current window location
        const targetOrigin = window.location.origin;

        window.opener.postMessage(
          'authorization:github:success:{"token":"${token}","provider":"github"}',
          targetOrigin
        );
        
        // Force close the window out of courtesy
        setTimeout(() => { window.close(); }, 500);
      </script>
    </body>
    </html>
    `;
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(script);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error while communicating with GitHub');
    }
}
