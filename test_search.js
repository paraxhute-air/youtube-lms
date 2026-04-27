const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const apiKey = envFile.split('\n').find(l => l.startsWith('YOUTUBE_API_KEY=')).split('=')[1];
async function test() {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("channelId", "UC_x5XG1OV2P6uZZ5FSM9Ttw"); // Google Developers
  url.searchParams.set("relevanceLanguage", "en");
  
  const res = await fetch(url.toString());
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Error details:", data.error?.errors);
}
test();
