from opentrons import protocol_api


metadata = {
    "protocolName": "🛠 3.10 only Python 🛠",
    "author": "Opentrons Engineering <engineering@opentrons.com>",
    "source": "Software Testing Team",
    "description": ("Python 3.10 Only"),
    "apiLevel": "2.12",
}


class Point:
    def __init__(self, x: int, y: int) -> None:
        self.x: int = x
        self.y: int = y

    def location(self) -> str:
        match self:
            case Point(x=0, y=0):
                return "Origin is the point's location."
            case Point(x=0, y=self.y):
                return f"Y={self.y} and the point is on the y-axis."
            case Point(x=self.x, y=0):
                return f"X={self.x} and the point is on the x-axis."
            case Point():
                return "The point is located somewhere else on the plane."


def run(ctx: protocol_api.ProtocolContext) -> None:
    """This method is run by the protocol engine."""
    ctx.comment(f"Where is the point? (0,0) {Point(0,0).location()}")
    ctx.comment(f"Where is the point? (0,1) {Point(0,1).location()}")
    ctx.comment(f"Where is the point? (1,0) {Point(1,0).location()}")
    ctx.comment(f"Where is the point? (1,1) {Point(1,1).location()}")
