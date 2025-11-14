/**************************************************************
 *  RD Burman Tribute - API Testing Script (FINAL VERSION)
 *  Fully corrected to match your .env and server.js
 **************************************************************/

require("dotenv").config();
const axios = require("axios");
const chalk = require("chalk");

/**************************************************************
 * ENV NORMALIZATION (CRITICAL!)
 * Maps older variable names to the correct ones used in .env
 **************************************************************/

process.env.YT_API_URL =
  process.env.YT_API_URL || process.env.YOUTUBE_API_URL;

process.env.GDRIVE_API_URL =
  process.env.GDRIVE_API_URL || process.env.GOOGLE_DRIVE_API_URL;

process.env.SPOTIFY_TOKEN =
  process.env.SPOTIFY_TOKEN || process.env.SPOTIFY_TOKEN_URL;

process.env.GOOGLE_API_KEY =
  process.env.GOOGLE_API_KEY || process.env.GOOGLE_DRIVE_API_KEY;

/**************************************************************
 * AXIOS CLIENT (NO PROXY)
 **************************************************************/
const axiosClient = axios.create({
  timeout: 10000,
  proxy: false
});

console.log(chalk.cyan("\n🎵 RD Burman Tribute - API Testing Script\n"));
console.log("══════════════════════════════════════════════\n");

/**************************************************************
 * TEST 1 — YouTube API
 **************************************************************/
async function testYouTube() {
  console.log("Test 1: Testing YouTube Data API v3...");

  try {
    const res = await axiosClient.get(process.env.YT_API_URL, {
      params: {
        key: process.env.YOUTUBE_API_KEY,
        q: "rd burman",
        part: "snippet",
        maxResults: 1
      }
    });

    console.log(chalk.green("   ✓ PASS - YouTube API Working\n"));
    return true;
  } catch (err) {
    console.log(chalk.red("   ✗ FAIL - YouTube API"));
    console.log("   " + chalk.red(err.message) + "\n");
    return false;
  }
}

/**************************************************************
 * TEST 2 — Google Drive API
 **************************************************************/
async function testGoogleDrive() {
  console.log("Test 2: Testing Google Drive API...");

  try {
    const res = await axiosClient.get(process.env.GDRIVE_API_URL, {
      params: {
        key: process.env.GOOGLE_API_KEY,
        q: "'root' in parents",
        fields: "files(id,name)"
      }
    });

    console.log(chalk.green("   ✓ PASS - Google Drive API Working\n"));
    return true;
  } catch (err) {
    console.log(chalk.red("   ✗ FAIL - Google Drive API"));
    console.log("   " + chalk.red(err.message) + "\n");
    return false;
  }
}

/**************************************************************
 * TEST 3 — Spotify API
 **************************************************************/
async function testSpotify() {
  console.log("Test 3: Testing Spotify Token Generation...");

  try {
    const credentials = Buffer.from(
      process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
    ).toString("base64");

    const res = await axiosClient.post(
      process.env.SPOTIFY_TOKEN,
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: "Basic " + credentials,
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    if (res.data.access_token) {
      console.log(chalk.green("   ✓ PASS - Spotify Token Working\n"));
      return true;
    }
  } catch (err) {
    console.log(chalk.red("   ✗ FAIL - Spotify API"));
    console.log("   " + chalk.red(err.message) + "\n");
    return false;
  }
}

/**************************************************************
 * TEST 4 — Google Drive Folder Tests
 **************************************************************/
async function testDriveFolders() {
  console.log("Test 4: Testing All Google Drive Folders...\n");

  const folders = {
    "2 Songs on Same Tune": process.env.GDRIVE_FOLDER_1,
    "A to M": process.env.GDRIVE_FOLDER_2,
    "Asha && R.D_Bangla": process.env.GDRIVE_FOLDER_3,
    "Gulzar_Asha_RD": process.env.GDRIVE_FOLDER_4,
    "N to Z": process.env.GDRIVE_FOLDER_5,
    "Pancham - Gulzar Remembers": process.env.GDRIVE_FOLDER_6
  };

  let allGood = true;

  for (const [name, id] of Object.entries(folders)) {
    try {
      const res = await axiosClient.get(process.env.GDRIVE_API_URL, {
        params: {
          key: process.env.GOOGLE_API_KEY,
          q: `'${id}' in parents`,
          fields: "files(id,name,mimeType)"
        }
      });

      console.log(
        chalk.green(`   ✓ ${name}: OK (Files: ${res.data.files?.length || 0})`)
      );
    } catch (err) {
      allGood = false;
      console.log(chalk.red(`   ✗ ${name}: Error`));
      console.log("     → " + chalk.red(err.message));
    }
  }

  console.log("");
  return allGood;
}

/**************************************************************
 * MAIN RUNNER
 **************************************************************/
(async () => {
  let passed = 0;
  let failed = 0;

  if (await testYouTube()) passed++;
  else failed++;

  if (await testGoogleDrive()) passed++;
  else failed++;

  if (await testSpotify()) passed++;
  else failed++;

  if (await testDriveFolders()) passed++;
  else failed++;

  console.log("\n══════════════════════════════════════════════");
  console.log(chalk.green(`Passed:   ${passed}`));
  console.log(chalk.red(`Failed:   ${failed}`));
  console.log("══════════════════════════════════════════════\n");

  if (failed === 0)
    console.log(chalk.green("🎉 ALL TESTS PASSED SUCCESSFULLY!"));
  else
    console.log(chalk.red("❌ Some tests failed. Check configuration."));
})();
