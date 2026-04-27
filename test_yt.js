const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const apiKey = envFile.split('\n').find(l => l.startsWith('YOUTUBE_API_KEY=')).split('=')[1];
async function test() {
  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("forHandle", "@nomadcoders");
  const res = await fetch(url.toString());
  console.log(res.status);
  console.log(await res.json());
}
test();
