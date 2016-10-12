import logging
import json
import os
import sys
import time
import threading
import pprint
pp = pprint.PrettyPrinter(indent=2)
sys.path.insert(0, os.path.abspath('..'))

import flask
from flask import Flask, render_template, request
from flask_socketio import SocketIO

from opentrons_sdk.robot import Robot

from server.helpers import get_frozen_root
from server.process_manager import run_once


TEMPLATES_FOLDER = os.path.join(get_frozen_root() or '', 'templates')
STATIC_FOLDER = os.path.join(get_frozen_root() or '', 'static')
BACKGROUND_TASKS = {}

app = Flask(__name__,
            static_folder=STATIC_FOLDER,
            template_folder=TEMPLATES_FOLDER
            )
app.jinja_env.autoescape = False
# Only allow JSON and Python files
app.config['ALLOWED_EXTENSIONS'] = set(['json', 'py'])
socketio = SocketIO(app, async_mode='gevent')
robot = Robot.get_instance()

# welcome route for connecting to robot
@app.route("/")
def welcome():
    return render_template("index.html")

# Check uploaded file is allowed file type: JSON or Python
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in app.config['ALLOWED_EXTENSIONS']

@app.route("/upload", methods=["POST"])
def upload():
    # pp.pprint(json.loads(request.data.read()decode('utf-8'))['file'])
    file = json.loads(request.data.decode('utf-8'))['file']
    filename = json.loads(request.data.decode('utf-8'))['filename']
    filetype = filename.rsplit('.', 1)[1]

    with open(filename, 'w') as file_:
        file_.write(file)

    pp.pprint(filename)
    pp.pprint(filetype)
    pp.pprint(file)

    errors = lintProtocol(filename, filetype)
    #create deepcopy, run on virtual smoothie w/
    #fake calibration data, return any errors

    if errors:
        data = errors
    else:
        data = "No errors :)"

    return flask.jsonify({
            'status': 200,
            'data': data
        })


@app.route('/dist/<path:filename>')
def script_loader(filename):
    root = get_frozen_root() or app.root_path
    scripts_root_path = os.path.join(root, 'templates', 'dist')
    return flask.send_from_directory(scripts_root_path, filename)


@app.route("/robot/serial/list")
def get_serial_ports_list():
    return flask.jsonify({
        'ports': robot.get_serial_ports_list()
    })


@app.route("/robot/serial/is_connected")
def is_connected():
    return flask.jsonify({
        'is_connected': robot.is_connected(),
        'port': robot.get_connected_port()
    })


@app.route("/robot/serial/connect")
def connect_robot():
    port = flask.request.args.get('port')

    status = 'success'
    data = None

    try:
        robot.connect(port)
    except Exception as e:
        status = 'error'
        data = str(e)

    connection_state_watcher, watcher_should_run = BACKGROUND_TASKS.get(
        'CONNECTION_STATE_WATCHER',
        (None, None)
    )

    if connection_state_watcher and watcher_should_run:
        watcher_should_run.set()

    watcher_should_run = threading.Event()
    def watch_connection_state(should_run):
        while not should_run.is_set():
            socketio.emit(
                'event',
                {'type': 'connection_status',
                 'is_connected': robot.is_connected()
                }
            )
            time.sleep(1.5)

    connection_state_watcher = socketio.start_background_task(
        watch_connection_state,
        (watcher_should_run)
    )
    BACKGROUND_TASKS['CONNECTION_STATE_WATCHER'] = (
        connection_state_watcher,
        watcher_should_run
    )

    return flask.jsonify({
        'status': status,
        'data': data
    })


@app.route("/robot/serial/disconnect")
def disconnect_robot():
    status = 'success'
    data = None

    try:
        robot.disconnect()
    except Exception as e:
        status = 'error'
        data = str(e)

    return flask.jsonify({
        'status': status,
        'data': data
    })

def lintProtocol(filename, filetype):
    from pylint import epylint as lint
    print("*****",filetype)
    if filetype == "py":
        (pylint_stdout, pylint_stderr) = lint.py_run(filename, return_std=True)
        print("passed the linting")
        return(pylint_stdout.getvalue(), pylint_stderr.getvalue())
    elif filetype == "json":
        #lint, convert to python, lint again
        pass

# NOTE(Ahmed): DO NOT REMOVE socketio requires a confirmation from the
# front end that a connection was established, this route does that.
@socketio.on('connected')
def on_connect():
    print('connected to front end...')


logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)-8s %(message)s',
    datefmt='%d-%m-%y %H:%M:%S'
)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        data_dir = sys.argv[1]
    else:
        data_dir = os.getcwd()

    IS_DEBUG = os.environ.get('DEBUG', '').lower() == 'true'
    if not IS_DEBUG:
        run_once(data_dir)

    socketio.run(
        app,
        debug=IS_DEBUG,
        port=5000
    )
