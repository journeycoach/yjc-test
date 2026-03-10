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
      <script>
        const receiveMessage = (message) => {
          console.log("OAuth callback received message: ", message.data, " from origin: ", message.origin);
          
          // Send the authorization success message back to the CMS
          window.opener.postMessage(
            'authorization:github:success:{"token":"${token}","provider":"github"}',
            message.origin
          );
          window.removeEventListener("message", receiveMessage, false);
        }
        
        // Listen for the CMS to explicitly request the token
        window.addEventListener("message", receiveMessage, false);
        
        // Initiate handshake with the CMS
        console.log("OAuth callback initiating handshake with CMS");
        window.opener.postMessage("authorizing:github", "*");
      </script>
    `;
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(script);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error while communicating with GitHub');
    }
}
