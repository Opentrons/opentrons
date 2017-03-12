import platform
import os
import re
import time


def get_arch():
    # Note: forcing arch to be 64 bit
    cpu_word_size = 64  # struct.calcsize('P') * 8
    if cpu_word_size == 64:
        return 'x64'
    if cpu_word_size == 32:
        return 'ia32'


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


