#!/usr/bin/env python3
"""
Bundle into an sdist-like tar.gz an installed python module suitable
for unzipping into a robot's python site-packages directory.
"""

import argparse
import io
import os
import tarfile
import pkg_resources

def build_tar(pkgname: str, outdir: str):
    os.makedirs(outdir, exist_ok=True)
    pkg = pkg_resources.get_distribution(pkgname)
    with tarfile.open(
            name=os.path.join(outdir, f'{pkgname}-{pkg.version}.tar.gz'),
            mode='w:gz') as tar:
        tar.add(os.path.join(pkg.location, pkgname), pkgname, recursive=True)
        tar.add(os.path.join(pkg.location, f'{pkgname}-{pkg.version}.dist-info'),
                f'{pkgname}-{pkg.version}.dist-info',
                recursive=True)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(metavar='PACKAGE', type=str, dest='package',
                        help='the python-importable (as opposed to pypi) name of the package to zip')
    parser.add_argument(metavar='OUTPUT_DIR', type=str, dest='outdir',
                        help='directory to emit the tar to, named PACKAGE-version.tar.gz')
    args = parser.parse_args()
    tar = build_tar(args.package, args.outdir)


if __name__ == '__main__':
    main()
