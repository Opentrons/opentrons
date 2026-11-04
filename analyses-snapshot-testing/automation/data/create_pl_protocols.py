import json
from pathlib import Path

import httpx
from rich import print

from automation.data.protocol import LABWARE_FOLDER, PROTOCOL_LIBRARY_PROTOCOLS_FOLDER

headers = {
    "accept": "*/*",
    "content-type": "application/json",
}

# GraphQL query to fetch protocols from the Opentrons Protocol Library
json_data = {
    "operationName": "GetCachedSearchResults",
    "variables": {
        "filters": {
            "type": [],
            "categories": [],
            "modules": [],
            "robots": [],
            "verifications": ["Manufacturer", "Opentrons"],
            "labware": [],
            "pipettes": [],
        },
        "terms": "",
        "pageNumber": 1,
        "numPerPage": 200,
    },
    "query": """query GetCachedSearchResults($terms: String, $filters: SearchFilters!, $pageNumber: Int!, $numPerPage: Int) {
      getCachedSearchResults(terms: $terms, filters: $filters) {
        protocols(pageNumber: $pageNumber, numPerPage: $numPerPage) {
          slug
          name
          isActive
          oemName
          hasLp
          customLabware
          protocolText
          protocolLibraryParameters
          robot {
            type
            name
          }
        }
      }
    }""",
}


def make_get_values_fn(params: list) -> str:
    """
    Generate a Python get_values function for protocol parameters.

    Args:
        params: List[dict] describing parameters.

    Returns:
        String containing the get_values function for protocol files.
    """
    default_values = {}
    for p in params:
        if "default" in p:
            default_values[p["name"]] = p["default"]
        elif p.get("type") == "dropDown" and p.get("options"):
            default_values[p["name"]] = p["options"][0]["value"]
        else:
            default_values[p["name"]] = None

    json_params = json.dumps(default_values).replace("\\n", "\\\\n").replace('\\"', '\\\\"').replace("\\r", "")
    fn = f"""def get_values(*names):
    import json
    _all_values = json.loads(\"\"\"{json_params}\"\"\")
    return [_all_values[n] for n in names]
"""
    return fn


def extract_api_level(protocol_text: str) -> str:
    """
    Extract the apiLevel from the requirements or metadata field in the protocol text.
    Returns the apiLevel as a string, or an empty string if not found.
    """
    import re

    # Regex explanation:
    # - Looks for either 'requirements' or 'metadata' followed by '=' and in a dict {}
    # - Matches any characters (including newlines) inside the dict (non-greedy)
    # - Searches for the key 'apiLevel' (single or double quotes)
    # - Captures the value of 'apiLevel' (single or double quotes)
    # - re.DOTALL allows '.' to match newlines for multi-line dicts
    # Try requirements first
    # Try to find apiLevel in 'requirements' or 'metadata' dicts
    match = re.search(
        r"(requirements|metadata)\s*=\s*\{[^}]*['\"]apiLevel['\"]\s*:\s*['\"]([^'\"]+)['\"]",
        protocol_text,
        re.DOTALL,
    )
    if match:
        return match.group(2).replace(".", "_")
    return ""


def extract_robot_type(protocol_text: str) -> str | None:
    """
    Extract the robot type from the protocol text.

    Returns "Flex" if 'robotType': 'Flex' is found, otherwise None.
    """
    import re

    if re.search(r'["\']robotType["\']\s*:\s*["\']Flex["\']', protocol_text):
        return "Flex"
    if re.search(r'["\']robotType["\']\s*:\s*["\']OT-3["\']', protocol_text):
        return "Flex"
    return None


def main():
    """
    Main function to fetch protocols from the Opentrons Protocol Library and save them to files.
    """
    print("Fetching protocols from Opentrons Protocol Library...")
    response = httpx.post("https://library.opentrons.com/api/graphql", headers=headers, json=json_data, timeout=20.0)
    data = response.json()
    response_size_mb = len(response.content) / (1024 * 1024)
    print(f"Response size: {response_size_mb:.2f} MB")
    # Extract protocol info and save to file
    protocols = data["data"]["getCachedSearchResults"]["protocols"]
    print(f"Found {len(protocols)} protocols.")
    written_count = 0

    for protocol in protocols:
        slug = protocol["slug"]
        protocol_text = protocol["protocolText"]
        robot_type = extract_robot_type(protocol_text)
        if robot_type is None:
            continue
        api_level = extract_api_level(protocol_text)
        if api_level:
            file_name = f"{robot_type}_S_v{api_level}_PL_{slug}.py"
        else:
            raise ValueError(f"API level not found in protocol {slug}")
        file_path = Path(PROTOCOL_LIBRARY_PROTOCOLS_FOLDER, file_name)
        with open(file_path, "w") as f:
            f.write(protocol_text)
        written_count += 1
        custom_labware = protocol.get("customLabware")
        if custom_labware:
            for idx, labware in enumerate(custom_labware):
                labware_file = Path(LABWARE_FOLDER, f"{slug}_labware_{idx + 1}.json")
                with open(labware_file, "w") as lf:
                    json.dump(labware, lf, indent=2)
        if protocol.get("hasLp"):
            params = protocol.get("protocolLibraryParameters", {})
            if params:
                get_values_code = make_get_values_fn(params)
                protocol_text = f"{get_values_code}\n\n{protocol_text}"
                # Overwrite file with new protocol including the prepended function
                with open(file_path, "w") as f:
                    f.write(protocol_text)
            else:
                raise ValueError(f"Protocol {slug} has hasLp=True but no parameters found")
    print(f"Wrote {written_count} protocol files.")


if __name__ == "__main__":
    main()
