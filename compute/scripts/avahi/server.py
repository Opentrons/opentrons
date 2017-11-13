import dbus

class AvahiServer:
    """ A server class to interact with the system Avahi server over dbus
    """

    def __init__(self):
        self.bus = dbus.SystemBus()
        raw_server = self.bus.get_object('org.freedesktop.Avahi', '/')
        self.server = dbus.Interface(raw_server, 'org.freedesktop.Avahi.Server')

    def GetVersion(self):
        """Avahi Server Version Check, return avahi version string, eg. "avahi 0.6.32"
        """
        try:
            return self.server.GetVersionString()
        except dbus.DBusException:
            return None

    def GetHostName(self):
        """Return hostname according to the Avahi server
        """
        try:
            return self.server.GetHostName()
        except dbus.DBusException:
            return None

    def GetDomainName(self):
        """Return hostname according to the Avahi server
        """
        try:
            return self.server.GetDomainName()
        except dbus.DBusException:
            return None

    def EntryGroupNew(self):
        """Return a new entry group for services
        """
        try:
            return self.server.EntryGroupNew()
        except dbus.DBusException:
            return None
