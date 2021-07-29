metadata = {
    "protocolName": "Extraction",
    "author": "Opentrons <protocols@opentrons.com>",
    "apiLevel": "2.4",
}


def run(ctx):
    ctx.load_module("pickle maker", "6")
