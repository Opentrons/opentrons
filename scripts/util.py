import platform


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
