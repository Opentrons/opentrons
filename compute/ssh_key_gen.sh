#!/usr/bin/env bash

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