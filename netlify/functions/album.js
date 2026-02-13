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

app.get("/*path", async (req, res) => {
  let path = req.path;
  if (path.startsWith("/album/")) path = path.replace(/^\/album\//, "/")
  const id = path.replace(/^\//, "");
  console.log("Extracted album ID:", id);
  if (!id) return res.status(400).json({ error: "Missing album ID" });

  try {
    const token = await getAccessToken();
    const albumResponse = await fetch(`https://api.spotify.com/v1/albums/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const albumData = await albumResponse.json();

    const cleanAlbumData = data => JSON.parse(JSON.stringify(data, (key, value) =>
      key === "available_markets" ? undefined : value
    ));

    res.json(cleanAlbumData(albumData));
  } catch (error) {
    console.error("Spotify fetch error:", error);
    res.status(500).json({ error: error.message });
  }
});

exports.handler = serverless(app);