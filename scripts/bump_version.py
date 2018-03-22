import os
import json
import argparse

FILE_DIR = os.path.dirname(os.path.realpath(__file__))
REPO_DIR = os.path.split(FILE_DIR)[0]


def read_json_file(filepath):
    with open(filepath, 'r') as file:
        data = json.load(file)
    return data


def write_json_file(filepath, data):
    with open(filepath, 'w') as file:
        json.dump(data, file, indent=2)
        file.write('\n')


def update_js_pkg(pkg, version, all_pkgs):
    """
    Updates the "version" field of a project's package.json and bumps the
    version of any monorepo sibling dependencies in the "dependencies" or
    "devDependencies" object
    """
    deps = pkg.get('dependencies')
    dev_deps = pkg.get('devDependencies')
    dep_names = [dep_pkg['name'] for dep_pkg in all_pkgs]

    for name in dep_names:
        if deps and name in deps:
            deps[name] = version
        if dev_deps and name in dev_deps:
            dev_deps[name] = version

    pkg['version'] = version
    if deps:
        pkg['dependencies'] = deps
    if dev_deps:
        pkg['devDependencies'] = dev_deps

    return pkg


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
        package.json in the root of the repo (this is primarily for cases when
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

    package_file = os.path.join(REPO_DIR, "package.json")
    pkg = read_json_file(package_file)
    pkg_version = pkg['version']

    print('Package version: {}'.format(pkg_version))

    split_ver = pkg_version.split('-')
    major, minor, bugfix = [int(x) for x in split_ver[0].split('.')]
    tags = ''
    if len(split_ver) > 1:
        tags = ''.join(['-{}'.format(tag) for tag in split_ver[1:]])

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
    pkg["version"] = new_version

    write_json_file(package_file, pkg)

    # JS sub-projects
    js_project_names = pkg['workspaces']
    js_pkg_files = [
        os.path.join(REPO_DIR, name, 'package.json')
        for name in js_project_names
    ]
    js_pkgs = [read_json_file(filename) for filename in js_pkg_files]
    js_projects = zip(js_project_names, js_pkg_files, js_pkgs)

    for name, project_pkg_file, project_pkg in js_projects:
        print('Updating version in package.json for {}'.format(name))
        project_pkg = update_js_pkg(project_pkg, new_version, js_pkgs)
        write_json_file(project_pkg_file, project_pkg)

    # Python sub-projects
    for project in ['api']:
        print('Updating version file for {}'.format(project))
        version_file = os.path.join(REPO_DIR, project, 'version')
        with open(version_file, 'w') as version_data:
            version_data.write(new_version + '\n')


if __name__ == '__main__':
    main()
