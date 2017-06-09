import time

from opentrons.drivers.smoothie_drivers import VirtualSmoothie


class SmoothiePlayer_2_0_0(object):

    def __init__(self, *args, **kwargs):
        self.is_recording = False
        self.recorded_commands = []
        self.connection = None
        self.whitelist = []
        self.progress_info = {
            'file': None,
            'percentage': None,
            'elapsed_time': None,
            'estimated_time': None,
            'current_byte': None,
            'total_bytes': None,
            'paused': None
        }

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

    def erase_progress_info(self):
        for key in self.progress_info.keys():
            self.progress_info[key] = None

    def is_connected(self):
        if self.connection:
            return self.connection.isOpen()
        return False

    def is_simulating(self):
        return bool(isinstance(
            self.connection.device(), VirtualSmoothie))

    def is_playing(self):
        return bool(self.progress_info['file'])

    def get_recorded_commands(self):
        return list(self.recorded_commands)

    def record_erase(self):
        self.recorded_commands = []
        self.erase_progress_info()

    def record_start(self, whitelist):
        self.whitelist = whitelist
        self.record_erase()
        self.is_recording = True
        self.erase_progress_info()

    def record_stop(self):
        self.is_recording = False
        self.erase_progress_info()

    def record(self, command, data):
        self.erase_progress_info()
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
        time.sleep(0.5)
        self.connection.flush_input()
        self.send_command('play /sd/protocol.gcode')
        self.wait_for_ok_response()

    def pause(self):
        '''
        Suspending print, waiting for queue to empty...
        // action:pause
        ok
        // Waiting for queue to empty (Host must stop sending)...
        // Saving current state...
        // Print Suspended, enter resume to continue printing
        '''
        res = self.send_command('suspend', timeout=5)
        self.wait_for_ok_response(timeout=5)
        if 'already suspended' in res.lower():
            return
        self.connection.readline_string()
        self.connection.readline_string()
        self.connection.readline_string()

    def resume(self):
        '''
        resuming print...
        Restoring saved XYZ positions and state...
        Resuming print
        // action:resume
        ok
        '''
        self.send_command('resume', timeout=5)
        self.wait_for_ok_response(timeout=5)

    def abort(self):
        self.send_command('abort', timeout=5)
        self.wait_for_ok_response(timeout=5)
        self.erase_progress_info()

    def progress(self, timeout=5):
        self.connection.flush_input()
        p_data = self.send_command('progress', timeout=timeout)
        words = ['play', 'file', 'paused']
        while len([s for s in words if s not in p_data.lower()]) == len(words):
            self.connection.wait_for_data(timeout=timeout)
            self.connection.serial_pause()
            p_data = self.connection.readline_string(timeout=timeout)
        self.wait_for_ok_response(timeout=timeout)

        p_bytes = self.send_command('M27', timeout=timeout)
        self.wait_for_ok_response(timeout=timeout)
        self._parse_progress_data(p_data, p_bytes)
        return dict(self.progress_info)

    def send_command(self, data, read_after=True, timeout=20):
        data += '\r\n'
        self.connection.write_string(data)
        if read_after:
            return self.connection.readline_string(timeout=timeout)

    def wait_for_ok_response(self, timeout=20):
        end_time = time.time() + timeout
        while end_time > time.time():
            if self.connection.readline_string().strip() == 'ok':
                return
        raise RuntimeError(
            'Did not get an OK from Smoothie within {} seconds'.format(
                timeout))

    def _parse_progress_data(self, progress_a, progress_b):
        e = 'Not currently playing'
        if progress_a == e or progress_b == e:
            self.erase_progress_info()
            return

        try:
            # SD printing byte 3980/53182
            byte_data = progress_b.strip().split(' ')[-1].split('/')
            self.progress_info['current_byte'] = int(byte_data[0])
            self.progress_info['total_bytes'] = int(byte_data[1])
        except Exception:
            raise RuntimeError(
                'Error parsing progress: {}'.format(progress_b))

        if 'pause' in progress_a:
            self.progress_info['paused'] = True
            return

        self.progress_info['paused'] = False
        try:
            # file: /sd/protocol.gcode, 7 % complete, elapsed time: 00:00:08, est time: 00:02:06  # noqa
            split_data = progress_a.split(',')

            file = split_data[0].strip().split(' ')[-1]
            self.progress_info['file'] = file.split('/')[-1]
            perc = split_data[1].split('%')[0].strip()
            self.progress_info['percentage'] = float(perc) / 100.0

            elapsed_time = split_data[2].split(':')
            t = int(elapsed_time[-1].strip())
            t += (int(elapsed_time[-2].strip()) * 60)
            t += (int(elapsed_time[-3].strip()) * 60 * 60)
            self.progress_info['elapsed_time'] = t

            # estimated time is not there in the beginning of a job
            estimated_time = None
            if len(split_data) > 3:
                estimated_time = split_data[3].split(':')
                est = int(estimated_time[-1].strip())
                est = int(estimated_time[-1].strip())
                est += (int(estimated_time[-2].strip()) * 60)
                est += (int(estimated_time[-3].strip()) * 60 * 60)
                self.progress_info['estimated_time'] = est
        except Exception:
            raise RuntimeError(
                'Error parsing progress: {}'.format(progress_a))
