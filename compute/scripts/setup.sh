#!/usr/bin/env bash


# Keep all IPv6 addresses on an interface down event. If set static
# global addresses with no expiration time are not flushed.
#
# This allows us to bind to Ethernet adapter's address even if the link
# us down: i.e. the robot is not connected over USB
#
# See: https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux-stable.git/tree/Documentation/networking/ip-sysctl.txt?id=refs/tags/v4.9
echo 1 > /proc/sys/net/ipv6/conf/eth0/keep_addr_on_down

# Network Manager Setup
nmcli connection add \
  save no \
  con-name 'local-ethernet' \
  autoconnect yes \
  type ethernet \
  ifname eth0 \
  ipv6.method manual \
  ipv6.address $ETHERNET_STATIC_IP/$ETHERNET_NETWORK_PREFIX_LENGTH \
  ipv4.method disabled

echo "$ETHERNET_STATIC_IP local-ethernet" >> /etc/hosts

# Dropbear config
if [ ! -e /etc/dropbear/ ] ; then
  mkdir /etc/dropbear/
fi
if [ ! -e /etc/dropbear/dropbear_dss_host_key ] ; then
  echo "Generating DSS-Hostkey..."
  /usr/bin/dropbearkey -t dss -f /etc/dropbear/dropbear_dss_host_key
fi
if [ ! -e /etc/dropbear/dropbear_rsa_host_key ] ; then
  echo "Generating RSA-Hostkey..."
  /usr/bin/dropbearkey -t rsa -f /etc/dropbear/dropbear_rsa_host_key
fi
if [ ! -e /etc/dropbear/dropbear_ecdsa_host_key ] ; then
  echo "Generating ECDSA-Hostkey..."
  /usr/bin/dropbearkey -t ecdsa -f /etc/dropbear/dropbear_ecdsa_host_key
fi
