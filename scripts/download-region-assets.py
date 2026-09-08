#!/usr/bin/env python3
"""Import selected local region assets for generations II-V.

Maps use Wikimedia Commons recreations published under CC0.
Location images use specific Bulbagarden Archives game-map files.
The app serves local copies; it never hotlinks these sources at runtime.
"""

from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen
import json

USER_AGENT = "pokedex-portfolio-region-assets/1.0"

REGIONS = {
    "johto": {
        "map": ("commons", "Johto Map.png"),
        "locations": {
            "new-bark-town.png": "New Bark Town HGSS.png",
            "goldenrod-city.png": "Goldenrod City HGSS.png",
            "ecruteak-city.png": "Ecruteak City HGSS.png",
            "olivine-city.png": "Olivine City HGSS.png",
            "blackthorn-city.png": "Blackthorn City HGSS.png",
        },
    },
    "hoenn": {
        "map": ("commons", "Hoenn Map.png"),
        "locations": {
            "littleroot-town.png": "Littleroot Town RS.png",
            "dewford-town.png": "Dewford Town RS.png",
            "fallarbor-town.png": "Fallarbor Town RS.png",
            "slateport-city.png": "Slateport City RS.png",
            "lilycove-city.png": "Lilycove City RS.png",
        },
    },
    "sinnoh": {
        "map": ("commons", "Sinnoh Map.png"),
        "locations": {
            "twinleaf-town.png": "Twinleaf Town DP.png",
            "jubilife-city.png": "Jubilife City DP.png",
            "hearthome-city.png": "Hearthome City DP.png",
            "veilstone-city.png": "Veilstone City DP.png",
            "snowpoint-city.png": "Snowpoint City DP.png",
        },
    },
    "unova": {
        "map": ("commons", "Unova Map.png"),
        "locations": {
            "nuvema-town.png": "Nuvema Town Spring BW.png",
            "accumula-town.png": "Accumula Town Summer BW.png",
            "nacrene-city.png": "Nacrene City Spring BW.png",
            "nimbasa-city.png": "Nimbasa City Spring BW.png",
            "driftveil-city.png": "Driftveil City Summer B2W2.png",
        },
    },
}


def bulbagarden_url(filename: str) -> str:
    api = "https://archives.bulbagarden.net/w/api.php"
    query = (
        f"{api}?action=query&format=json&prop=imageinfo"
        f"&iiprop=url|size&titles=File:{quote(filename)}"
    )
    request = Request(query, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=30) as response:
        payload = json.load(response)

    page = next(iter(payload["query"]["pages"].values()))
    imageinfo = page.get("imageinfo")
    if not imageinfo:
        raise RuntimeError(f"Bulbagarden asset not found: {filename}")
    return imageinfo[0]["url"]


def commons_url(filename: str) -> str:
    return (
        "https://commons.wikimedia.org/wiki/Special:Redirect/file/"
        + quote(filename)
    )


def download(url: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=90) as response:
        destination.write_bytes(response.read())


def resolve_url(source: str, filename: str) -> str:
    if source == "commons":
        return commons_url(filename)
    return bulbagarden_url(filename)


def main() -> None:
    for region_id, config in REGIONS.items():
        root = Path("assets/regions") / region_id
        root.mkdir(parents=True, exist_ok=True)

        source, filename = config["map"]
        map_path = root / "map.png"
        print(f"Downloading {region_id} map: {filename}")
        download(resolve_url(source, filename), map_path)

        for output_name, source_filename in config["locations"].items():
            destination = root / "locations" / output_name
            print(f"Downloading {region_id} location: {source_filename}")
            download(bulbagarden_url(source_filename), destination)

    print("Imported region assets for generations II-V.")


if __name__ == "__main__":
    main()
