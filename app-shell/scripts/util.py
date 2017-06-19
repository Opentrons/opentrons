import platform
import os
import re
import subprocess
import time


def get_arch():
    # Note: forcing arch to be 64 bit
    cpu_word_size = 64  # struct.calcsize('P') * 8
    if cpu_word_size == 64:
        return 'x64'
    if cpu_word_size == 32:
        return 'ia32'


def get_branch():
    """
    Returns current branch in repo
    """
    return (
        os.environ.get('APPVEYOR_REPO_BRANCH') or
        os.environ.get('TRAVIS_BRANCH') or
        get_cmd_value("git branch | grep \* | cut -d ' ' -f2").strip()  # TeamCity
    )


def get_cmd_value(cmd):
    return subprocess.check_output(cmd, shell=True).decode()


def get_os():
    """
    Gets the OS to based on the command line argument of the platform info.
    Only possibilities are: "windows", "mac", "linux"
    """

    valid_os = {
        'win': 'win',
        'windows': 'win',
        'linux': 'linux',
        'darwin': 'mac'
    }

    os_found = platform.system().lower()

    if os_found not in valid_os:
        raise SystemExit("Exit: OS data found is invalid '%s'" % os_found)

    return valid_os[os_found]


def get_build_tag(os_type):
    """
    Gets the OS, CPU architecture (32 vs 64 bit), and current time stamp and
    appends CI branch, commit, or pull request info
    :return: string of os, arch, and time stamp and if CI info if available
    """
    arch_time_stamp = "{}{}_{}".format(
        platform.system(),
        64,  # struct.calcsize('P') * 8,
        time.strftime("%Y-%m-%d_%H.%M")
    )

    ci_tag = None

    if os_type in {"mac", "linux"}:
        ci_tag = tag_from_ci_env_vars(
            ci_name='Travis-CI',
            pull_request_var='TRAVIS_PULL_REQUEST',
            branch_var='TRAVIS_BRANCH',
            commit_var='TRAVIS_COMMIT'
        )

    if os_type == "win":
        ci_tag = tag_from_ci_env_vars(
            ci_name='Appveyor-CI',
            pull_request_var='APPVEYOR_PULL_REQUEST_NUMBER',
            branch_var='APPVEYOR_REPO_BRANCH',
            commit_var='APPVEYOR_REPO_COMMIT'
        )

    app_version = '2.2.0' # get_app_version()

    build_tag = "v{app_version}-{arch_time_stamp}".format(
        app_version=app_version,
        arch_time_stamp=arch_time_stamp
    )

    if ci_tag:
        return "{}_{}".format(build_tag, ci_tag)
    return build_tag


def is_ci():
    return (
        os.environ.get('CI') or  # Travis CI, AppVeyor, CircleCi, Gitlab
        os.environ.get('CONTINUOUS_INTEGRATION') or  # TravisCI
        os.environ.get('BUILD_NUMBER') or  # TeamCity, Jenkins
        False
    )


def is_master_branch():
    return get_branch().strip() == 'master'


def tag_from_ci_env_vars(ci_name, pull_request_var, branch_var, commit_var):
    pull_request = os.environ.get(pull_request_var)
    branch = os.environ.get(branch_var)
    commit = os.environ.get(commit_var)

    if pull_request and pull_request != 'false':
        try:
            pr_number = int(re.findall("\d+", pull_request)[0])
            return 'pull_{}'.format(pr_number)
        except (ValueError, TypeError):
            pass
    if branch and commit:
        return "{}_{}".format(branch, commit[:10])
    return None


def republish_win_s3(yml_file, exe_file):
    """
    Temporary fix for: https://github.com/electron-userland/electron-builder/issues/1582
    """

    import tinys3
    print(
        '[Electron-S3-Republish] attempint to republish', yml_file, exe_file)

    conn = tinys3.Connection(
        os.environ.get('AWS_ACCESS_KEY'),
        os.environ.get('AWS_SECRET_KEY'),
        tls=True
    )
    channel = os.environ.get('CHANNEL')

    conn.upload(
        'channels/{}/{}'.format(channel, os.path.basename(yml_file)),
        open(yml_file, 'rb'),
        'ot-app-builds'
    )

    conn.upload(
        'channels/{}/{}'.format(channel, os.path.basename(exe_file)),
        open(exe_file, 'rb'),
        'ot-app-builds'
    )
