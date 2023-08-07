"""Belt Calibration OT3."""
import argparse
import asyncio

from hardware_testing.production_qc.belt_calibration_ot3 import run


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--skip-test", action="store_true")
    args = parser.parse_args()
    asyncio.run(run(args.simulate, args.skip_test))
