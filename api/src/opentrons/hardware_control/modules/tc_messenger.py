import sys
from serial import Serial

_READ_ALL = "readall"
_READ_LINE = "read"
_LID_AND_SEAL_STATUS = "status"
_MOVE_SEAL = "ms"
_DONE = "done"


def comms_loop(dev):
    exit = False
    command = input("enter a command\n")
    if command == _READ_ALL:
        print(dev.readlines())
    elif command == _READ_LINE:
        print(dev.readline())
    elif command == _LID_AND_SEAL_STATUS:
        dev.write("M119\n".encode())
        print(dev.readline())
    elif command == _MOVE_SEAL:
        distance = input("enter distance in steps")
        dev.write(f"M241.D {distance}\n")
        print(dev.readline())
    elif command == _DONE:
        exit = True
    else:
        dev.write(f"{command}\n")
        print(dev.readline())

    return exit


def _main():
    dev = Serial('/dev/ot_module_thermocycler0', 9600, timeout=2)
    run = True
    while run:
        run = comms_loop(dev)

if __name__ == '__main__':
    sys.exit(_main())