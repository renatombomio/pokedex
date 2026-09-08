#!/usr/bin/env python3
"""Download the selected Kanto map assets from Bulbagarden Archives.

This script is intentionally kept outside the app runtime. It is an asset
import step: the application serves local files from assets/regions/kanto.
"""

from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen
import json

API = "https://archives.bulbagarden.net/w/api.php"
OUTPUT_DIR = Path("assets/regions/kanto")

ASSETS = {
    "map.png": "FRLG Kanto.png",
    "locations/pallet-town.png": "Pallet Town FRLG.png",
    "locations/viridian-city.png": "Viridian City FRLG.png",
    "locations/pewter-city.png": "Pewter City FRLG.png",
    "locations/cerulean-city.png": "Cerulean City FRLG.png",
    "locations/vermilion-city.png": "Vermilion City FRLG.png",
    "locations/lavender-town.png": "Lavender Town FRLG.png",
    "locations/celadon-city.png": "Celadon City FRLG.png",
    "locations/fuchsia-city.png": "Fuchsia City FRLG.png",
    "locations/saffron-city.png": "Saffron City FRLG.png",
    "locations/cinnabar-island.png": "Cinnabar Island FRLG.png",
    "locations/indigo-plateau.png": "Indigo Plateau FRLG.png",
}

USER_AGENT = "pokedex-portfolio-asset-import/1.0"


def get_image_url(filename: str) -> str:
    query = (
        f"{API}?action=query&format=json&prop=imageinfo"
        f"&iiprop=url|size&titles=File:{quote(filename)}"
    )
    request = Request(query, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=30) as response:
        payload = json.load(response)

    pages = payload["query"]["pages"]
    page = next(iter(pages.values()))
    imageinfo = page.get("imageinfo")
    if not imageinfo:
        raise RuntimeError(f"No imageinfo returned for {filename}")
    return imageinfo[0]["url"]


def download(url: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=60) as response:
        destination.write_bytes(response.read())


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for relative_path, source_filename in ASSETS.items():
        destination = OUTPUT_DIR / relative_path
        url = get_image_url(source_filename)
        print(f"Downloading {source_filename} -> {destination}")
        download(url, destination)

    print(f"Downloaded {len(ASSETS)} Kanto assets into {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
