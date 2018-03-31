import atexit
import os
import socket
import subprocess

from opentrons.util import environment


RESULT_SPACE = '\t- {}'
FAIL = 'FAIL'
PASS = 'PASS'

USB_MOUNT_FILEPATH = '/mnt/usbdrive'


def record_camera(filepath):
    print('\nUSB Camera')
    # record 1 second of video from the USB camera
    c = 'ffmpeg -video_size 320x240 -i /dev/video0 -t 00:00:01 {} -loglevel quiet > /dev/null'  # NOQA
    try:
        subprocess.check_output(c.format(filepath), shell=True)
        print(RESULT_SPACE.format(PASS))
    except Exception:
        print(RESULT_SPACE.format(FAIL))


def copy_to_usb_drive_and_back(filepath):
    # create the mount directory
    print('\nUSB Flash-Drive')

    if _find_storage_device():
        # move the file to and from it
        name = filepath.split('/')[-1]
        try:
            subprocess.check_output(
                'mv {0} /mnt/usbdrive/{1}'.format(filepath, name),
                shell=True)
        except Exception:
            print(RESULT_SPACE.format(FAIL))
            return
        if os.path.exists('/mnt/usbdrive/{}'.format(name)):
            try:
                subprocess.check_output(
                    'mv /mnt/usbdrive/{0} {1}'.format(name, filepath),
                    shell=True)
            except Exception:
                print(RESULT_SPACE.format(FAIL))
                return
            if os.path.exists(filepath):
                print(RESULT_SPACE.format(PASS))
            else:
                print(RESULT_SPACE.format(FAIL))
        else:
            print(RESULT_SPACE.format(FAIL))


def start_server(folder, filepath):
    print('\nOPEN --> {0}:8000/{1}\n\n'.format(
        _this_wifi_ip_address(),
        filepath.split('/')[-1]
        ))
    subprocess.check_output(
        'cd {} && python -m http.server > /dev/null'.format(folder),
        shell=True)


def _find_storage_device():
    if os.path.exists(USB_MOUNT_FILEPATH) is False:
        subprocess.check_output('mkdir {}'.format(USB_MOUNT_FILEPATH),
            shell=True)
    if os.path.ismount(USB_MOUNT_FILEPATH) == False:
        sdn1_devices = [
            '/dev/sd{}1'.format(l)
            for l in 'abcdefgh'
            if os.path.exists('/dev/sd{}1'.format(l))
        ]
        if len(sdn1_devices) == 0:
            print(RESULT_SPACE.format(FAIL))
            return
        try:
            subprocess.check_output(
                'mount {0} {1}'.format(sdn1_devices[0], USB_MOUNT_FILEPATH),
                shell=True)
        except Exception:
            print(RESULT_SPACE.format(FAIL))
            return
    return True


def _this_wifi_ip_address():
    gw = os.popen("ip -4 route show default").read().split()
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect((gw[2], 0))
    return s.getsockname()[0]


def _erase_data(filepath):
    if os.path.exists(filepath):
        os.remove(filepath)


if __name__ == "__main__":
    data_folder_path = environment.get_path('APP_DATA_DIR')
    video_file_path = os.path.join(data_folder_path, './cam_test.mp4')
    atexit.register(_erase_data, video_file_path)
    record_camera(video_file_path)
    copy_to_usb_drive_and_back(video_file_path)
    start_server(data_folder_path, video_file_path)
    exit()
