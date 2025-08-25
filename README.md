# Figma File Fetcher

This is a Node.js script to get a Figma design file using the [Figma API](https://www.figma.com/developers/api).
It saves the file data as JSON and downloads the images from the design.

---

## What it does

- Get a Figma file with the API
- Save the full file as `figmaFile.json`
- Save a smaller version with only frames and components as `figmaExtracted.json`
- Download all images into `figmaImages/`

---

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file and add your Figma token:

   ```env
   FIGMA_TOKEN=your_personal_access_token
   ```

3. Make sure your account has **view access** to the Figma file.

---

## Run the script

```bash
 npm start
```

---

## Output files

- `figmaFile.json` → full file data
- `figmaExtracted.json` → only frames/components
- `figmaImages/` → downloaded images

Example folder after running:

```
.
├── src/index.js
├── figmaFile.json
├── figmaExtracted.json
├── figmaImages/
│   ├── image_1.png
│   ├── image_2.png
```

---

## Notes

- Every run downloads everything again.
- To stop `nodemon` from reloading on file changes, add a `nodemon.json` file:

```json
{
  "watch": ["fetchFigma.js"],
  "ignore": ["figmaImages/*", "figmaExtracted.json", "figmaFile.json"]
}
```

- The Figma API has rate limits. Do not run the script too often.

---
