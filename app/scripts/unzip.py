import os
import subprocess
import sys
import zipfile


def unzip(src, dest):
    zip_obj = zipfile.ZipFile(src, 'r')
    zip_obj.extractall(dest)
    zip_obj.close()


if __name__ == '__main__':
    unzip(sys.argv[1], sys.argv[2])
