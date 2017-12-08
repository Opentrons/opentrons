#!/usr/bin/env bash


# Keep all IPv6 addresses on an interface down event. If set static
# global addresses with no expiration time are not flushed.
#
# This allows us to bind to Ethernet adapter's address even if the link
# us down: i.e. the robot is not connected over USB
#
# See: https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux-stable.git/tree/Documentation/networking/ip-sysctl.txt?id=refs/tags/v4.9
echo 1 > /proc/sys/net/ipv6/conf/eth0/keep_addr_on_down

# Disable duplicate address detection (DAD)
# Leaving DAD enabled sometimes results in static address being reset
# to a random value after robot restart with USB plugged in,
# because host computer remembers it being used and reports collision.
echo 0 > /proc/sys/net/ipv6/conf/eth0/accept_dad

# Cleanup any connections. This will leave only wlan0
nmcli --terse --fields uuid,device connection show | sed -rn 's/(.*):(--)/\1/p' | xargs nmcli connection del
nmcli --terse --fields uuid,device connection show | sed -rn 's/(.*):(eth0)/\1/p' | xargs nmcli connection del

# Clean up opentrons package dir if it's a first start of a new container
touch /data/id
if [ '$(cat /data/id)' != $CONTAINER_ID ] ; then
  echo 'First start of a new container. Deleting local Opentrons API installation'
  rm -rf /data/packages/usr/local/lib/python3.6/site-packages/opentrons*
  echo $CONTAINER_ID > /data/id
fi

# Set static address so we can find the device from host computer over
# ethernet without using Bojnjour or any kind of service discovery, making
# overall solution more cross-platform compatible
ip address flush dev eth0
ip address \
  add $ETHERNET_STATIC_IP/$ETHERNET_NETWORK_PREFIX_LENGTH \
  dev eth0
ip link set dev eth0 up

# Add host name record so other services can bind to address by hostname
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
