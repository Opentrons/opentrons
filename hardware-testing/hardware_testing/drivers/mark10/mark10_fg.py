from serial import Serial
import time

class Timer:
    def __init__(self):
        self._start_time = None
        self._elasped_time = None

    def start(self):
        """Start a new timer"""
        self._start_time = time.perf_counter()

    def elasped_time(self):
        """report the elapsed time"""
        self._elasped_time = time.perf_counter() - self._start_time
        return self._elasped_time

    def stop_time(self):
        if self._start_time is None:
            raise TimerError(f"Timer is not running. Use .start() to start it")
        stop_time = time.perf_counter()

class Mark10():
    def __init__(self, connection: Serial) -> None:
        """Constructor."""
        self._force_guage = connection
        self._timer = Timer()
        self._units = None

    @classmethod
    def create(
        cls, port: str, baudrate: int = 115200, timeout: float = 1
    ) -> "RadwagScale":
        """Create a Radwag scale driver."""
        conn = Serial()
        conn.port = port
        conn.baudrate = baudrate
        conn.timeout = timeout
        return Mark10(connection=conn)

    def connect(self) -> None:
        """Connect"""
        self._force_guage.open()

    def disconnect(self) -> None:
        """Disconnect"""
        self._force_guage.close()

    def get_reading(self) -> tuple:
        self._force_guage.flushInput()
        self._force_guage.flushOutput()
        self._force_guage.write('?\r\n'.encode("utf-8"))
        reading = True
        while reading:
            (force_val, units) = self._force_guage.readline().strip().split()
            if force_val != b'':
                reading = False
        units = str(units, 'utf-8')
        self._unit = units
        if units != 'N':
            self._force_guage.write('N\r\n') # Set force gauge units to Newtons
            print(f"Gauge units are not correct, expected 'N' currently is {units}. \
                        Please change units to N")
        force_val = str(force_val,'utf-8')
        return (force_val, units)
