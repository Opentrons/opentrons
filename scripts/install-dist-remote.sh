#!/usr/bin/env sh
set +eux
IFS=$'\n\t'

remotecheck () {
    if [ -d /opt/opentrons-robot-server ] || [ -e /etc/VERSION.json ] ; then
        return
    fi
    if [ -z ${INSTALL_SDIST_REMOTE_ALLOW_LOCAL_WHICH_MEANS_THIS_WILL_DELETE_ITSELF+x} ] ; then
     cat <<EOF
This script should only be run by an SSH command onto a Flex robot. Do not run it
locally. If you really really want to run it locally set the environment variable
INSTALL_SDIST_REMOTE_ALLOW_LOCAL_WHICH_MEANS_THIS_WILL_DELETE_ITSELF.
EOF
     exit 1
    fi
}


remotecheck

if [[ $# -ne 2 ]] ; then
    cat <<EOF
Usage: ./install-sdist-remote.sh DISTPATH TARGETPATH

DISTPATH: Path to the distribution (i.e. wheel file) to install
TARGETPATH: Path to the target environment (i.e. /usr/lib/python3.10/site-packages, /opt/opentrons-robot-server)

Set the environment variable QUIET=1 or Q=1 to suppress diagnostic output.
EOF
    exit 1
fi

if [ -z "${QUIET+x}" ] && [ -z "${Q+x}" ] ; then
    echo "Printing all commands, set QUIET or Q to suppress"
    set -o xtrace
fi

_me="$0"
_distpath="$1"
_targetpath="$2"

_unzipdir="${_distpath}-unzip"

cleanup () {
    cd /
    pip3 config --global set install.root /var/user-packages
    rm -f "${_distpath:?}"
    unlink "${_me:?}"
    mount -o remount,ro /

}
trap cleanup EXIT

mount -o remount,rw /
pip3 config --global unset install.root
pip3 install --no-deps --upgrade --ignore-installed -t "${_targetpath}" "${_distpath}"
exit 0
