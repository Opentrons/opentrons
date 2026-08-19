import json
from pathlib import Path


def extract_filter_keys():
    # Resolve path to ../shared-data/labware/definitions/2 relative to the 'api' directory
    base_dir = (
        Path(__file__).resolve().parent
        if "__file__" in globals()
        else Path.cwd()
    )
    definitions_path = (
        base_dir / "../shared-data/labware/definitions/2"
    ).resolve()

    if not definitions_path.exists():
        print(f"Error: Directory not found at {definitions_path}")
        return

    extracted_records = []

    # Iterate over all definition folders ending with '_filter'
    for folder in sorted(definitions_path.glob("*_filter")):
        if folder.is_dir():
            for json_file in folder.glob("*.json"):
                with open(json_file, "r", encoding="utf-8") as f:
                    data = json.load(f)

                # Pull displayName from metadata or top-level fallback
                display_name = data.get("metadata", {}).get(
                    "displayName", data.get("displayName")
                )

                # Pull loadName from parameters or top-level fallback
                load_name = data.get("parameters", {}).get(
                    "loadName", data.get("loadName", folder.name)
                )

                # Pull brand details from 'brand' mapping if structured as an object
                brand_obj = data.get("brand", {})
                brand_name = (
                    brand_obj.get("brand")
                    if isinstance(brand_obj, dict)
                    else data.get("brand")
                )
                links = (
                    brand_obj.get("links", [])
                    if isinstance(brand_obj, dict)
                    else data.get("links", [])
                )

                record = {
                    "displayName": display_name,
                    "loadName": load_name,
                    "brand": brand_name,
                    "links": links,
                }
                extracted_records.append(record)

    # Print results formatted cleanly
    print(f"Extracted {len(extracted_records)} filter plate definition(s):\n")
    for item in extracted_records:
        print(f"displayName: {item['displayName']}")
        print(f"loadName:    {item['loadName']}")
        print(f"brand:       {item['brand']}")
        print(f"links:       {item['links']}")
        print("-" * 60)

    return extracted_records


if __name__ == "__main__":
    extract_filter_keys()