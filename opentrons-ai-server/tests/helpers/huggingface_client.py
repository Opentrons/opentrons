from httpx import Client as HttpxClient
from httpx import Response, Timeout
from pydantic import BaseModel
from rich.console import Console
from rich.prompt import Prompt
from rich.rule import Rule

from tests.helpers.client import print_response
from tests.helpers.settings import Settings, get_settings

console = Console()


class Protocol(BaseModel):
    name: str
    content: str


class HuggingfaceClient:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.auth_headers = self.get_auth_headers()
        self.invalid_auth_headers = self.get_auth_headers("bad_token")
        self.type_headers = {"Content-Type": "application/json"}
        self.standard_headers = {
            **self.type_headers,
            **self.auth_headers,
        }
        self.timeout = Timeout(connect=5.0, read=180.0, write=180.0, pool=5.0)
        self.httpx = HttpxClient(base_url=self.settings.BASE_URL, timeout=self.timeout)

    def close(self) -> None:
        """Closes the HTTPX client instance."""
        self.httpx.close()

    def get_auth_headers(self, token_override: str | None = None) -> dict[str, str]:
        if token_override:
            return {"Authorization": f"Bearer {token_override}"}
        return {"Authorization": f"Bearer {self.settings.HF_API_KEY}"}

    def post_simulate_protocol(self, protocol: Protocol) -> Response:
        console.print(self.auth_headers)
        return self.httpx.post("https://opentrons-simulator.hf.space/protocol", headers=self.standard_headers, json=protocol.model_dump())


def main() -> None:
    env = Prompt.ask("Select environment", choices=["local", "dev", "sandbox", "crt", "staging", "prod"], default="local")
    settings = get_settings(env=env)
    client = HuggingfaceClient(settings)
    try:
        console.print(Rule("Simulate a protocol", style="bold"))
        protocol_contents = """
from opentrons import protocol_api

# metadata
metadata = {
    'protocolName': 'Aspiration and Dispense',
    'author': 'Your Name <your.email@example.com>',
    'description': 'A simple protocol to aspirate from a test tube and dispense into a PCR plate using a Gen2 20µl pipette',
    'apiLevel': '2.15'
}

def run(protocol: protocol_api.ProtocolContext):
    # labware
    tip_rack = protocol.load_labware('opentrons_96_tiprack_20ul', '1')
    test_tube_rack = protocol.load_labware('opentrons_24_tuberack_generic_2ml_screwcap', '2')
    pcr_plate = protocol.load_labware('nest_96_wellplate_100ul_pcr_full_skirt', '3')

    # pipettes
    pipette = protocol.load_instrument('p20_single_gen2', 'right', tip_racks=[tip_rack])

    # reagents and locations
    test_tube = test_tube_rack.wells_by_name()['A1']
    pcr_well = pcr_plate.wells_by_name()['A1']

    # protocol steps
    pipette.pick_up_tip()
    pipette.aspirate(10, test_tube)  # aspirate 10µl from the test tube
    pipette.dispense(10, pcr_well)   # dispense 10µl into the PCR plate well
    pipette.drop_tip()
"""
        protocol = Protocol(name="AspirationAndDispense.py", content=protocol_contents)
        response = client.post_simulate_protocol(protocol)
        print(response.request.headers)
        print_response(response)

    finally:
        client.close()


if __name__ == "__main__":
    main()
