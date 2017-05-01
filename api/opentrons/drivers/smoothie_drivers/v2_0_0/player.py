class SmoothiePlayer_2_0_0(object):

    def __init__(self, *args, **kwargs):
        self.is_recording = False
        self.recorded_commands = []
        self.connection = None
        self.whitelist = []

    def get_connected_port(self):
        """
        Returns the port the driver is currently connected to
        :return:
        """
        if not self.connection:
            return
        return self.connection.name()

    def connect(self, c):
        self.connection = c
        self.connection.close()
        self.connection.open()
        self.connection.serial_pause()
        self.connection.flush_input()

    def disconnect(self):
        if self.is_connected():
            self.connection.close()

    def is_connected(self):
        if self.connection:
            return self.connection.isOpen()
        return False

    def is_simulating(self):
        return bool(isinstance(
            self.connection.device(), VirtualSmoothie))

    def get_recorded_commands(self):
        return list(self.recorded_commands)

    def record_erase(self):
        self.recorded_commands = []

    def record_start(self, whitelist):
        self.whitelist = whitelist
        self.record_erase()
        self.is_recording = True

    def record_stop(self):
        self.is_recording = False

    def record(self, command, data):
        if self.is_recording:
            for c in self.whitelist:
                if c in command:
                    self.recorded_commands.append(data)

    def play(self, c):
        self.connect(c)
        self.pause()
        self.resume()
        self.abort()
        self.send_command('upload /sd/protocol.gcode')
        for line in self.get_recorded_commands():
            self.connection.write_string(line)
        self.send_command('\x04')
        self.send_command('play /sd/protocol.gcode')
        self.connection.readline_string()
        self.connection.readline_string()

    def pause(self):
        res = self.send_command('suspend', timeout=30)
        if 'waiting for queue to empty...' in res:
            self.connection.readline_string(timeout=20)
            self.connection.readline_string(timeout=20)
            self.connection.readline_string(timeout=20)
        self.connection.flush_input()

    def resume(self):
        self.send_command('resume', timeout=30)
        self.connection.flush_input()

    def abort(self):
        self.send_command('abort', timeout=30)
        self.connection.flush_input()

    def progress(self):
        self.connection.flush_input()
        p_data = self.send_command('progress')
        while 'play' not in p_data.lower() and 'file' not in p_data.lower():
            p_data = self.connection.readline_string()
        self.connection.readline_string()

        p_bytes = self.send_command('M27')
        self.connection.readline_string()
        return self._parse_progress_data(p_data, p_bytes)

    def send_command(self, data, read_after=True, timeout=20):
        data += '\r\n'
        self.connection.write_string(data)
        if read_after:
            return self.connection.readline_string(timeout=timeout)

    def _parse_progress_data(self, progress_a, progress_b):
        progress_info = {
            'file': None,
            'percentage': None,
            'elapsed_time': None,
            'estimated_time': None,
            'current_byte': None,
            'total_bytes': None
        }
        e = 'Not currently playing'
        if progress_a != e and progress_b != e:
            try:
                # file: /sd/protocol.gcode, 7 % complete, elapsed time: 00:00:08, est time: 00:02:06  # noqa
                split_data = progress_a.split(',')

                file = split_data[0].strip().split(' ')[-1]
                progress_info['file'] = file.split('/')[-1]
                perc = split_data[1].split('%')[0].strip()
                progress_info['percentage'] = float(perc) / 100.0

                elapsed_time = split_data[2].split(':')
                t = int(elapsed_time[-1].strip())
                t += (int(elapsed_time[-2].strip()) * 60)
                t += (int(elapsed_time[-3].strip()) * 60 * 60)
                progress_info['elapsed_time'] = t

                # estimated time is not there in the beginning of a job
                estimated_time = None
                if len(split_data) > 3:
                    estimated_time = split_data[3].split(':')
                    est = int(estimated_time[-1].strip())
                    est = int(estimated_time[-1].strip())
                    est += (int(estimated_time[-2].strip()) * 60)
                    est += (int(estimated_time[-3].strip()) * 60 * 60)
                    progress_info['estimated_time'] = est
            except Exception:
                raise RuntimeError(
                    'Error parsing progress: {}'.format(progress_a))

            try:
                # SD printing byte 3980/53182
                byte_data = progress_b.strip().split(' ')[-1].split('/')
                progress_info['current_byte'] = int(byte_data[0])
                progress_info['total_bytes'] = int(byte_data[1])
            except Exception:
                raise RuntimeError(
                    'Error parsing progress: {}'.format(progress_b))

        if progress_info.get('file'):
            return progress_info
        return None
