import dbus
import os
from time import sleep

from .server import AvahiServer

class AvahiService:

    def __init__(self, service_name, service_type, port, txt=[], keep_alive=False):
        """Announce a service over Avahi through dbus

        service_name: string with service's name
        service_type: string with service's type, eg. '_http._tcp'
        port: integer with port number
        txt: TXT fields as array of string in a format of ["key1=value1", "key2=value2"], by default it's empty (ie. [])
        keep_alive: whether to keep running this server until interruption.
                    Default is False. Use False if you run this script within your server,
                    use True if you are running this script as standalone, because the service
                    disappears as soon as the script stops otherwise.
        """
        self.bus = dbus.SystemBus()
        self.avahiserver = AvahiServer()
        self.path = self.avahiserver.EntryGroupNew()
        raw_server = self.bus.get_object('org.freedesktop.Avahi', self.path)
        self.server = dbus.Interface(raw_server, 'org.freedesktop.Avahi.EntryGroup')

        hostname, domainname = self.avahiserver.GetHostName(), self.avahiserver.GetDomainName()
        self.server.AddService(dbus.Int32(-1), # avahi.IF_UNSPEC
                               dbus.Int32(-1), # avahi.PROTO_UNSPEC
                               dbus.UInt32(0), # flags
                               service_name, # sname
                               service_type, # stype
                               domainname, # sdomain
                               "{}.{}".format(hostname, domainname), # shost
                               dbus.UInt16(port), # port
                               dbus.Array(txt, signature='ay')) # TXT field, this is empty at the moment
        self.server.Commit()
        if keep_alive:
            while True:
                sleep(60)
