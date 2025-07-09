import argparse
import random

from automation.analyze import gen_analyses_files
from automation.data.collect import protocols_under_test

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", "-L", type=int, default=None, help="Limit to N random protocol objects")
    args = parser.parse_args()
    protocols = protocols_under_test()
    if args.limit is not None and len(protocols) > args.limit:
        protocols = random.sample(protocols, args.limit)
    gen_analyses_files(protocols)
