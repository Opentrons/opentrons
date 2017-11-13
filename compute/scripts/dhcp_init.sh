
# kill any existing dnsmasq
pkill -9 dnsmasq
ifdown eth0
ifup eth0

# Start the access point
dnsmasq
