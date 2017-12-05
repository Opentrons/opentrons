#!/usr/bin/env bash

# Network Manager Setup
nmcli connection add \
  save no \
  con-name 'local-ethernet' \
  autoconnect yes \
  type ethernet \
  ifname eth0 \
  ipv6.method manual \
  ipv6.address fd00:0000:cafe:fefe::1/64 \
  ipv4.method disabled

echo "fd00:0000:cafe:fefe::1 local-ethernet" >> /etc/hosts

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
