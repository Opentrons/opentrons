class SmoothiePlayer_2_0_0(SmoothieDriver):

	def __init__(self, *args, **kwargs):
		self.save_gcode_commands = False
        self.gcode_commands_sent = []

    def connect(self, c):
    	self.connection = c
        self.connection.open()
        self.connection.flush_input()

	def get_recorded_commands(self):
        return list(self.gcode_commands_sent)

    def record_erase(self):
        self.gcode_commands_sent = []

    def record_start(self):
        self.record_erase()
        self.save_gcode_commands = True

    def record_stop(self):
        self.save_gcode_commands = False

    def record_command(self, command, data):
        if self.is_simulating() and self.is_recording():
            for c in self.COMMANDS_TO_RECORD:
                if c in command:
                    self.gcode_commands_sent.append(data)

    def player_is_playing(self):
        p = bool(self.player_progress())
        if self.is_playing and not p:
            self.set_smoothie_defaults()
        self.is_playing = p
        return bool(self.is_playing)

    def player_play(self):
        self.player_pause()
        self.player_resume()
        self.player_stop()
        self.send_command('upload /sd/protocol.gcode')
        for line in self.get_recorded_commands():
            self.connection.write_string(line)
        self.send_command('\x04')
        self.send_command('play /sd/protocol.gcode')
        self.ignore_next_line()
        self.wait_for_ok()

	def player_pause(self):
        res = self.send_command('suspend', timeout=30)
        if 'waiting for queue to empty...' in res:
            self.ignore_next_line()
            self.ignore_next_line()
            self.readline_from_serial(timeout=60)
        self.connection.flush_input()

    def player_resume(self):
        self.send_command('resume', timeout=30)
        self.connection.flush_input()

    def player_stop(self):
        self.send_command('abort', timeout=30)
        self.connection.flush_input()

	def player_progress(self):
        self.connection.flush_input()
        s_t = time.time()
        p_data = self.send_command('progress')
        while 'play' not in p_data.lower() and 'file' not in p_data.lower():
            p_data = self.read_next_line()
        self.ignore_next_line(lines=1)

        p_bytes = self.send_command('M27')
        self.ignore_next_line(lines=2)
        return self._parse_progress_data(p_data, p_bytes)

    def send_command(self, data, read_after=True):
        data += '\r\n'
        self.connection.write_string(data)
        if read_after:
            return self.read_next_line()

    def read_next_line(self):
        self.connection.wait_for_data()
        return self.connection.readline_string()

    def ignore_next_line(self, lines=1):
        for i in range(lines):
            self.read_next_line()
        self.connection.flush_input()

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