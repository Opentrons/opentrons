import os


# Contants that use paths defined by environment variables that should be set
# on the robot, and fall back to paths relative to this file within the source
# repository for development purposes
FILE_DIR = os.path.abspath(os.path.dirname(__file__))

def default_audio_dir():
    return os.environ.get(
        'AUDIO_FILES',
        os.path.abspath(os.path.join(
            FILE_DIR, '..', '..', '..', 'audio')))


def test_speaker():
	# 
	pass


def _play_audio_file(filepath):
	pass
