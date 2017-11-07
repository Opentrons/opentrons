#!/usr/bin/env python
import dbus, uuid

# https://cgit.freedesktop.org/NetworkManager/NetworkManager/tree/examples/python/dbus/add-connection.py

s_con = dbus.Dictionary({
    'type': '802-3-ethernet',
    'uuid': str(uuid.uuid4()),
    'id': 'ethernet',
    'interface-name':'eth0'
})

address = dbus.Dictionary({'address': '192.1.2.3', 'prefix': dbus.UInt32(24)})

s_ip4 = dbus.Dictionary({
    'address-data': dbus.Array([address], signature=dbus.Signature('a{sv}')),
    'method': 'manual'})

s_ip6 = dbus.Dictionary({'method': 'ignore'})

con = dbus.Dictionary({
    'connection': s_con,
    'ipv4': s_ip4,
    'ipv6': s_ip6
})

bus = dbus.SystemBus()

proxy = bus.get_object(
    "org.freedesktop.NetworkManager",
    "/org/freedesktop/NetworkManager/Settings"
)

settings = dbus.Interface(proxy, "org.freedesktop.NetworkManager.Settings")

settings.AddConnection(con)
