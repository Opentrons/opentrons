"""
Edit an opentrons wheel to remove any carriage returns from files in resources

If there are crs in the scripts in resources/, the robot will not be able to
boot because those files are sourced directly during the boot process. While
the crs may be rewritten when they are committed and pushed to github, if a
windows dev does a push-api from their local checkout there's a good chance
the crs will still be present.

This script therefore opens the specified wheel, unzips it to a tempdir,
removes any carriage returns found in /resources, and rezips it to the
original filename.
"""

import zipfile
import tempfile
import os
import sys
import re


def _write_files(outzip, contentsdir, verbose=False):
    for dirpath, dirnames, filenames in os.walk(contentsdir):
        for fn in filenames:
            fn_abs = os.path.join(dirpath, fn)
            zip_path = os.path.relpath(fn_abs, contentsdir)
            outzip.write(fn_abs, zip_path)


def _edit_files(indir, verbose=False):
    to_edit = []
    print(os.listdir(os.path.join(indir, 'opentrons')))
    for root, _2, filenames in os.walk(os.path.join(indir,
                                                    'opentrons',
                                                    'resources')):
        to_edit.extend([os.path.join(root, fn) for fn in filenames])
    if verbose:
        print("File edit list: {}".format(to_edit))
    for fn in to_edit:
        # We don’t need to edit python files
        if verbose:
            sys.stdout.write("Checking {}: ".format(fn))
        if fn.endswith('.py') or fn.endswith('.pyc'):
            if verbose:
                print("Skipped (is python file)")
            continue
        # Or python files that don’t look like python files
        try:
            first = open(fn).readline()
        except UnicodeDecodeError:  # (or binary files)
            print("Skipped (is most likely binary)")
            continue
        else:
            if first.startswith('#!') and 'python' in first:
                if verbose:
                    print("Skipped (is shebanged python file)")
                continue
        contents = open(fn, 'rb').read()
        new = re.sub(b'\r\n', b'\n', contents)
        if verbose:
            if len(contents)-len(new) > 0:
                print("Edited (found {} <cr>)"
                      .format(len(contents)-len(new)))
            else:
                print("Nothing to do")
        open(fn, 'wb').write(new)


def rewrite_egg(infile, outfile, verbose=False):
    """ Rewrite any <cr> in the resources/ subdirectory of the specified egg.

    filelike should be an open filelike object holding the egg.
    """
    with tempfile.TemporaryDirectory() as tempdir:
        with zipfile.ZipFile(infile, 'r') as inzip:
            if verbose:
                print("Extracting {} to {}".format(inzip, tempdir))
            inzip.extractall(tempdir)
        print("Editing files in {}".format(tempdir))
        _edit_files(tempdir, verbose)
        with zipfile.ZipFile(outfile, 'w') as outzip:
            if verbose:
                print("Zipping {} to {}".format(tempdir, outzip))
            _write_files(outzip, tempdir, verbose)


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(
        description='Create a new opentrons egg without <cr> in shell scripts')
    parser.add_argument(
        'in_whl', metavar='INWHL', type=str,
        help='The wheel file, or directory containing the egg file, to read')
    parser.add_argument(
        'out_whl', metavar='OUTWHL', type=str,
        help='The wheel file to write. If not specified, execute in place',
        nargs='?',
        default=None)
    parser.add_argument('-v', '--verbose', help='Print extra status messages',
                        action='store_true')
    args = parser.parse_args()
    if os.path.isdir(args.in_whl):
        files = os.listdir(args.in_whl)
        for f in files:
            if re.match('opentrons-.*.whl', f):
                in_whl = os.path.join(args.in_whl, f)
                break
        else:
            raise OSError("Couldn't find anything that looked like a wheel in {}"
                          .format(args.in_whl))
    else:
        in_whl = args.in_whl
    if None is args.out_whl:
        out_whl = in_whl
    else:
        out_whl = args.out_whl

    rewrite_egg(in_whl, out_whl, args.verbose)
