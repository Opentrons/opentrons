import atexit
import logging
import os
import socket
import subprocess


def record_camera(filepath):
    print_bars()
    print('SAVING 1-SECOND OF CAMERA INPUT TO VIDEO FILE...')
    print_bars()
    # record 1 second of video from the USB camera
    c = 'ffmpeg -video_size 320x240 -i /dev/video0 -t 00:00:01 {}'
    os.system(c.format(filepath))


def copy_to_usb_drive_and_back(filepath):
    # create the mount directory
    if os.path.exists('/mnt/usbdrive') is False:
        os.system('mkdir /mnt/usbdrive')
    # find the storage device
    for l in 'abcdefgh':
        if os.path.exists('/dev/sd{}1'.format(l)):
            # mount it
            os.system('mount /dev/sd{}1 /mnt/usbdrive'.format(l))
    # move the file to and from it
    name = filepath.split('/')[-1]
    print_bars()
    print('Moving video recording to USB drive...')
    os.system('mv {0} /mnt/usbdrive/{1}'.format(filepath, name))
    if os.path.exists('/mnt/usbdrive/{}'.format(name)):
        print('Success')
        print('Moving video recording back to local storage...')
        os.system('mv /mnt/usbdrive/{0} {1}'.format(name, filepath))
        if os.path.exists(filepath):
            print('Success')
            print_bars()
        else:
            raise Exception('Failed copying from USB drive to local storage')
    else:
        raise Exception('Failed writing to USB drive')


def start_server(filepath):
    print_bars()
    print('OPEN YOUR WEB BROWSER TO --> {0}:8000/{1}'.format(
        this_wifi_ip_address(),
        filepath.split('/')[-1]
        ))
    print_bars()
    subprocess.check_output('python -m http.server', shell=True)


def print_bars():
    print('\n\n*********\n*********\n*********\n\n')


def this_wifi_ip_address():
    gw = os.popen("ip -4 route show default").read().split()
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect((gw[2], 0))
    return s.getsockname()[0]


def erase_data(filepath):
    if os.path.exists(filepath):
        os.remove(filepath)


if __name__ == "__main__":
    video_file_path = os.path.join(
        os.path.dirname(__file__), './cam_test.mp4')
    atexit.register(erase_data, video_file_path)
    record_camera(video_file_path)
    copy_to_usb_drive_and_back(video_file_path)
    start_server(video_file_path)
    exit()
