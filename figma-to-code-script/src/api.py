from fastapi import FastAPI, Query
import requests
from typing import Optional
from dotenv import load_dotenv
import os
import json
from pydantic import BaseModel
from pathlib import Path

class NodeIDsRequest(BaseModel):
    file_json: dict

class ImageRequest(BaseModel):
    image_node_ids: list

class DownloadRequest(BaseModel):
    images: dict

load_dotenv()
FIGMA_TOKEN = os.getenv('FIGMA_TOKEN')
app = FastAPI()

@app.get("/health")
def health_check():
    return {"status": "ok"}


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

@app.post("/figma/file/")
def fetch_figma_json_file(file_key: str, save: Optional[bool] = Query(False, description="Option to save the file on disk")):
    url = f"https://api.figma.com/v1/files/{file_key}"
    
    try:
        # Fetch the JSON data from Figma
        jsonData = https_get_json(url, FIGMA_TOKEN)
        
        if save:
            with open("figmaFile.json", 'w', encoding='utf-8') as figmaFile:
                json.dump(jsonData, figmaFile, indent=2)
            return {"status": "success", "message": "Figma file fetch & saved successfully"}
        else:
            return {"status": "success", "message": "Figma file fetched successfully", "JSON data": jsonData}
    
    except Exception as e:
        return {"status": "error", "message": str(e)}


def collect_node_ids(node: dict, image_node_ids: set):
    if not node:
        return
    if 'fills' in node and isinstance(node["fills"], list):
        for fill in node['fills']:
            if fill.get("type") == "IMAGE"and fill.get("imageRef"):
                image_node_ids.add(node['id'])
    
    if "children" in node and isinstance(node['children'], list):
        for child in node['children']: 
            collect_node_ids(child, image_node_ids)

@app.post("/figma/image_nodes/")
def get_image_node_ids(body: NodeIDsRequest):
    image_node_ids = set()
    collect_node_ids(body.file_json.get('document'), image_node_ids)
    return json.dumps(image_node_ids)
     

@app.post("/figma/image/")
def get_images_urls(file_key: str, body: ImageRequest):
    if not body.image_node_ids:
        return {"status": "client error", "message": "Please provide image node ids"}
    ids_params = ",".join(body.image_node_ids)
    url = f"https://api.figma.com/v1/images/{file_key}?ids={ids_params}&format=png"
    return https_get_json(url, token=FIGMA_TOKEN)

@app.post("/figma/image_download/")
def download_image_from_urls(body: DownloadRequest):
    for nodeId, url in body.images.items():
        images_dir = Path('./figmaImages')
        images_dir.mkdir(exist_ok=True)

        fileName = images_dir/f"{nodeId}.png"
        response = requests.get(url, stream=True)
        if response.status_code != 200:
            raise RuntimeError(f"Failed to download image : {response.status_code}")
        
        f= open(fileName, 'wb')
        for chunk in response.iter_content(1024):
            f.write(chunk)

        f.close()
    return {"status": "200", "message": "successfully downloaded image"}

