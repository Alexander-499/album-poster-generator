const express = require("express");
const serverless = require("serverless-http");

const app = express();

const CLIENT_ID = process.env.CLIENT_ID?.trim();
const CLIENT_SECRET = process.env.CLIENT_SECRET?.trim();
if (!CLIENT_ID || !CLIENT_SECRET) console.error("Missing Spotify credentials in env vars");

const encoded = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
let cachedToken = null;
let tokenExpiry = 0;
async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) return cachedToken;

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${encoded}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials"
  });

  const data = await response.json();
  if (!data.access_token) throw new Error(JSON.stringify(data));
  tokenExpiry = now + (data.expires_in - 60) * 1000;
  cachedToken = data.access_token;
  return data.access_token;
}

app.get("/album/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const token = await getAccessToken();
    const albumResponse = await fetch(`https://api.spotify.com/v1/albums/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const albumData = await albumResponse.json();
    res.json(albumData);
  } catch (error) { res.status(500).json({ error: error.message })}
});

exports.handler = serverless(app);