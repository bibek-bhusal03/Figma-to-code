import os
import sys
import json
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

FILE_KEY = "j1Y7dKEiGpTOEP07zZoXEQ"  # your Figma file key
TOKEN = os.getenv("FIGMA_TOKEN")      # your personal access token

print("🚀 Starting Figma to Code Script", TOKEN)
if not TOKEN:
    print("❌ Please set FIGMA_TOKEN env variable before running")
    sys.exit(1)


def https_get_json(url: str, token: str):
    headers = {"X-Figma-Token": token}
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        try:
            return response.json()
        except Exception as e:
            raise RuntimeError(f"Failed to parse JSON: {e}")
    else:
        raise RuntimeError(f"Status {response.status_code}: {response.text}")


def fetch_figma_file(file_key: str, token: str):
    url = f"https://api.figma.com/v1/files/{file_key}"
    return https_get_json(url, token)


def fetch_image_urls(file_key: str, node_ids: list[str], token: str):
    if not node_ids:
        return {"images": {}}
    ids_param = ",".join(node_ids)
    url = f"https://api.figma.com/v1/images/{file_key}?ids={ids_param}&format=png"
    return https_get_json(url, token)


def download_image(url: str, filepath: Path):
    response = requests.get(url, stream=True)
    if response.status_code != 200:
        raise RuntimeError(f"Failed to download image: {response.status_code}")

    f = open(filepath, "wb")
    try:
        for chunk in response.iter_content(1024):
            f.write(chunk)
    finally: 
        f.close()


def traverse(node, image_node_ids: set):
    """Traverse Figma document tree and collect node IDs with IMAGE fills."""
    if not node:
        return

    if "fills" in node and isinstance(node["fills"], list):
        for fill in node["fills"]:
            if fill.get("type") == "IMAGE" and fill.get("imageRef"):
                image_node_ids.add(node["id"])

    if "children" in node and isinstance(node["children"], list):
        for child in node["children"]:
            traverse(child, image_node_ids)


def main():
    try:
        print("📥 Fetching Figma file...")
        file_json = fetch_figma_file(FILE_KEY, TOKEN)

        # Save full JSON
        with open("figmaFile.json", "w", encoding="utf-8") as f:
            json.dump(file_json, f, indent=2, ensure_ascii=False)
        print("✅ Saved raw file to figmaFile.json")

        # Collect all image node IDs
        image_node_ids = set()
        traverse(file_json.get("document"), image_node_ids)
        image_node_ids_arr = list(image_node_ids)

        # Fetch image URLs
        images_response = fetch_image_urls(FILE_KEY, image_node_ids_arr, TOKEN)

        # Download images
        if images_response.get("images"):
            images_dir = Path("./figmaImages")
            images_dir.mkdir(exist_ok=True)

            print(f"📥 Downloading {len(images_response['images'])} images...")
            for node_id, url in images_response["images"].items():
                if not url:
                    continue
                filename = images_dir / f"{node_id}.png"
                download_image(url, filename)
                print(f"🖼️  Downloaded image for node {node_id}")
            print("✅ All images downloaded.")
        else:
            print("ℹ️ No images found to download.")

    except Exception as err:
        print("❌ Error:", str(err))


if __name__ == "__main__":
    main()
