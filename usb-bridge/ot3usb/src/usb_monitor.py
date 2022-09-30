import pyudev
import logging

LOG = logging.getLogger(__name__)

class USBConnectionMonitor:
    """Class to monitor host connections over the USB Serial line."""

    def __init__(self, phy_udev_name: str, udc_name: str) -> None:
        """Initialize a USBConnectionMonitor.
        
        Args:
            phy_udev_name: The name of the USB PHY on the system, 
            the name below 'platform' for monitoring udev
            
            udc_name: The name of the UDC hardware, for checking connection state manually
        """
        self._phy_udev_name = phy_udev_name
        self._udc_name = udc_name 

        self._udev_ctx = pyudev.Context()
        

        self._monitor = pyudev.Monitor.from_netlink(self._udev_ctx)
        self._monitor.filter_by('platform')

        self._observer = pyudev.MonitorObserver(
            self._monitor, self.monitor_callback)
        
        LOG.info(f'Monitoring platform/{phy_udev_name}')
        
    
    def begin(self):
        self._observer.start()
    
    def stop(self):
        self._observer.stop()

    def monitor_callback(self, action, device):
        print(f'ACTION: {action} - {device}')