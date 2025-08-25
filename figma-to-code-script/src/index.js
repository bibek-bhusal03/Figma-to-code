const https = require("https");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const FILE_KEY = "j1Y7dKEiGpTOEP07zZoXEQ"; // your file key(key of your figma file) here
const TOKEN = process.env.FIGMA_TOKEN; // your personal access token here

console.log("🚀 Starting Figma to Code Script", TOKEN);
if (!TOKEN) {
  console.error("❌ Please set FIGMA_TOKEN env variable before running");
  process.exit(1);
}

// Simple https GET helper that returns JSON
function httpsGetJson(hostname, path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      path,
      method: "GET",
      headers: {
        "X-Figma-Token": token,
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error("Failed to parse JSON"));
          }
        } else {
          reject(
            new Error(`Status ${res.statusCode}: ${data || res.statusMessage}`)
          );
        }
      });
    });

    req.on("error", (e) => reject(e));
    req.end();
  });
}

// Fetch the full Figma file JSON
async function fetchFigmaFile(fileKey, token) {
  return httpsGetJson("api.figma.com", `/v1/files/${fileKey}`, token);
}

// Fetch images URLs from the image API endpoint
async function fetchImageUrls(fileKey, nodeIds, token) {
  const idsParam = encodeURIComponent(nodeIds.join(","));
  return httpsGetJson(
    "api.figma.com",
    `/v1/images/${fileKey}?ids=${idsParam}&format=png`,
    token
  );
}

// Download an image from a URL and save to local path
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          return reject(
            new Error(`Failed to download image: ${res.statusCode}`)
          );
        }
        const fileStream = fs.createWriteStream(filepath);
        res.pipe(fileStream);
        fileStream.on("finish", () => fileStream.close(resolve));
        fileStream.on("error", reject);
      })
      .on("error", reject);
  });
}

// Traverse Figma document and collect text nodes, colors, and image node IDs
function traverse(node, results) {
  if (!node) return;

  if (node.type === "TEXT") {
    results.texts.push({
      id: node.id,
      name: node.name,
      content: node.characters || "",
    });
  }

  if (node.fills && Array.isArray(node.fills)) {
    node.fills.forEach((fill) => {
      if (fill.type === "SOLID" && fill.color) {
        results.colors.push({
          id: node.id,
          name: node.name,
          color: {
            r: Math.round(fill.color.r * 255),
            g: Math.round(fill.color.g * 255),
            b: Math.round(fill.color.b * 255),
          },
        });
      }
    });
  }

  // Collect image hashes from fills of type IMAGE
  if (node.fills && Array.isArray(node.fills)) {
    node.fills.forEach((fill) => {
      if (fill.type === "IMAGE" && fill.imageRef) {
        results.imageNodeIds.add(node.id);
      }
    });
  }

  // Also check for images in other node properties (like fills inside children)
  if (node.children && Array.isArray(node.children)) {
    node.children.forEach((child) => traverse(child, results));
  }
}

async function main() {
  try {
    console.log("📥 Fetching Figma file...");
    const fileJson = await fetchFigmaFile(FILE_KEY, TOKEN);

    // Save raw file
    fs.writeFileSync(
      "figmaFile.json",
      JSON.stringify(fileJson, null, 2),
      "utf8"
    );
    console.log("✅ Saved raw file to figmaFile.json");

    // Extract texts, colors, and image node IDs
    const results = {
      texts: [],
      colors: [],
      imageNodeIds: new Set(),
    };
    traverse(fileJson.document, results);

    // Convert imageNodeIds Set to Array for API call
    const imageNodeIdsArr = Array.from(results.imageNodeIds);

    // Fetch image URLs from Figma API
    let imagesResponse = { images: {} };
    if (imageNodeIdsArr.length > 0) {
      console.log(`📥 Fetching ${imageNodeIdsArr.length} image URLs...`);
      imagesResponse = await fetchImageUrls(FILE_KEY, imageNodeIdsArr, TOKEN);
    }

    // Save extracted data (excluding imageNodeIds set)
    const extractedData = {
      texts: results.texts,
      colors: results.colors,
      images: imagesResponse.images,
    };
    fs.writeFileSync(
      "figmaExtracted.json",
      JSON.stringify(extractedData, null, 2),
      "utf8"
    );
    console.log("✅ Saved extracted data to figmaExtracted.json");

    // Download images
    if (
      imagesResponse.images &&
      Object.keys(imagesResponse.images).length > 0
    ) {
      const imagesDir = "./figmaImages";
      if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);

      console.log(
        `📥 Downloading ${Object.keys(imagesResponse.images).length} images...`
      );
      for (const [nodeId, url] of Object.entries(imagesResponse.images)) {
        if (!url) continue;
        const filename = path.join(imagesDir, `${nodeId}.png`);
        await downloadImage(url, filename);
        console.log(`🖼️  Downloaded image for node ${nodeId}`);
      }
      console.log("✅ All images downloaded.");
    } else {
      console.log("ℹ️ No images found to download.");
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

main();
