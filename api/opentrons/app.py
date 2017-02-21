import threading

from opentrons.server.main import run


app_thread = None

def start():
    global app_thread
    app_thread = threading.Thread(target=run, args=())
    app_thread.start()


def stop():
    import pdb; pdb.set_trace()
    app_thread.stop()
