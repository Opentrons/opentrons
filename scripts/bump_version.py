import os
import json
import argparse
from subprocess import run

FILE_DIR = os.path.dirname(os.path.realpath(__file__))
REPO_DIR = os.path.split(FILE_DIR)[0]


def main():
    """
    Bumps version numbers across all sub-projects. Use this script instead of
    updating version numbers manually. Specify only one of --major, --minor, or
    --bugfix.

    If --major is specified, the major version will be incremented by 1 and
        the minor and bugfix will be set to 0
    If --minor is specified, the minor version will be incremented by 1 and
        the bugfix will be set to 0 (major version unchanged)
    If --bugfix is specified, the bugfix will be incremented by 1 (and others
        left unchanged)
    If --sync is specified, all sub-projects are updated with the contents of
        version.json in the root of the repo (this is primarily for cases when
        the version should be hard-set outside of normal sequence--this should
        not be used in normal operation, generally only to undo an accidental
        bump or such)
    """
    parser = argparse.ArgumentParser(
        description='Update versions of all sub-project in this repository')
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--major', action='store_true')
    group.add_argument('--minor', action='store_true')
    group.add_argument('--bugfix', action='store_true')
    group.add_argument('--sync', action='store_true')
    args = parser.parse_args()

    ver_file = os.path.join(REPO_DIR, "package.json")

    with open(ver_file, 'r') as version_data:
        current_version = json.load(version_data)

    split_ver = current_version['version'].split('-')
    major, minor, bugfix = [int(x) for x in split_ver[0].split('.')]
    tags = ''
    if len(split_ver) > 1:
        tags = ''.join(['-{}'.format(tag) for tag in split_ver[1:]])

    # # For branch-dependent operations
    # current_branch = run(
    #     "git rev-parse --abbrev-ref HEAD",
    #     shell=True,
    #     stdout=PIPE,
    #     encoding="UTF-8"
    # ).stdout

    # if 'v3a' not in current_branch:
    #     print("Current branch: {}".format(current_branch))
    #     rev_hash = run(
    #         "git rev-parse --short HEAD",
    #         shell=True,
    #         stdout=PIPE,
    #         encoding="UTF-8"
    #     ).stdout
    #     current_version = "{}-{}".format(current_version, rev_hash)

    print("Prior version: {}".format(current_version))
    if args.major:
        major = major + 1
        minor = 0
        bugfix = 0
    if args.minor:
        minor = minor + 1
        bugfix = 0
    if args.bugfix:
        bugfix = bugfix + 1

    new_version = "{}.{}.{}{}".format(major, minor, bugfix, tags)
    print("Setting all sub-projects to version: {}".format(new_version))
    current_version["version"] = new_version

    with open(ver_file, 'w') as version_data:
        json.dump(current_version, version_data, indent=2)

    # JS sub-projects
    for project in ['components', 'app', 'protocol-designer']:
        print('Updating version field in package.json for {}'.format(project))
        pkg_file = os.path.join(REPO_DIR, project, 'package.json')
        command = """sed -i 's/.*version.*/  "version": "{}",/g' {}""".format(new_version, pkg_file)  # NOQA
        run(command)

    # Python sub-projects
    for project in ['api']:
        print('Updating version file for {}'.format(project))
        version_file = os.path.join(REPO_DIR, project, 'version')
        with open(version_file, 'w') as version_data:
            version_data.write(new_version + '\n')


if __name__ == '__main__':
    main()
