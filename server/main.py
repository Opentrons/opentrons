import logging
import os
import sys
import threading

import flask
from flask import Flask, render_template, request
from flask_socketio import SocketIO
from flask_cors import CORS

from opentrons_sdk.robot import Robot
from opentrons_sdk.containers.placeable import Container

sys.path.insert(0, os.path.abspath('..'))
from server.helpers import get_frozen_root
from server.process_manager import run_once

TEMPLATES_FOLDER = os.path.join(get_frozen_root() or '', 'templates')
STATIC_FOLDER = os.path.join(get_frozen_root() or '', 'static')
BACKGROUND_TASKS = {}

app = Flask(__name__,
            static_folder=STATIC_FOLDER,
            template_folder=TEMPLATES_FOLDER
            )
CORS(app)
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


def load_python(stream):
    global robot

    code = ''.join([line.decode() for line in stream])
    api_response = {'error': None, 'warnings': []}

    robot.reset()
    try:
        exec(code, globals(), locals())
        robot.run()
    except Exception as e:
        api_response['error'] = str(e)

    api_response['warnings'] = robot.get_warnings()

    return api_response


def load_json(stream):
    pass


@app.route("/upload", methods=["POST"])
def upload():
    file = request.files.get('file')

    if not file:
        return flask.jsonify({
            'status': 'error',
            'data': 'File expected'
        })

    extension = file.filename.split('.')[-1].lower()

    api_response = None
    if extension == 'py':
        api_response = load_python(file.stream)
    elif extension == 'json':
        api_response = load_json(file.stream)
    else:
        return flask.jsonify({
            'status': 'error',
            'data': '{} is not a valid extension. Expected'
            '.py or .json'.format(extension)
        })

    calibrations = get_placeables()

    return flask.jsonify({
        'status': 'success',
        'data': {
            'error': api_response['error'],
            'warnings': api_response['warnings'],
            'calibrations': calibrations
        }
    })


@app.route('/dist/<path:filename>')
def script_loader(filename):
    root = get_frozen_root() or app.root_path
    scripts_root_path = os.path.join(root, 'templates', 'dist')
    return flask.send_from_directory(scripts_root_path, filename)


@app.route("/robot/serial/list")
def get_serial_ports_list():
    return flask.jsonify({
        'ports': Robot.get_instance().get_serial_ports_list()
    })


@app.route("/robot/serial/is_connected")
def is_connected():
    return flask.jsonify({
        'is_connected': Robot.get_instance().is_connected(),
        'port': Robot.get_instance().get_connected_port()
    })


@app.route("/robot/serial/connect")
def connect_robot():
    port = flask.request.args.get('port')

    status = 'success'
    data = None

    try:
        Robot.get_instance().connect(port)
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
                {
                    'type': 'connection_status',
                    'is_connected': Robot.get_instance().is_connected()
                }
            )
            socketio.sleep(1.5)

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
        Robot.get_instance().disconnect()
    except Exception as e:
        status = 'error'
        data = str(e)

    return flask.jsonify({
        'status': status,
        'data': data
    })


@app.route("/instruments/placeables")
def placeables():
    data = get_placeables()
    return flask.jsonify({
        'status': 200,
        'data': data
    })


def get_placeables():

    def get_containers(instrument):
        unique_containers = set()

        for placeable in instrument.placeables:
            containers = [c for c in placeable.get_trace() if isinstance(
                c, Container)]
            unique_containers.add(containers[0])
        return list(unique_containers)

    data = [{
        'axis': instrument.axis,
        'label': instrument.name,
        'top': instrument.positions['top'],
        'bottom': instrument.positions['bottom'],
        'blow_out': instrument.positions['blow_out'],
        'drop_tip': instrument.positions['drop_tip'],
        'max_volume': instrument.max_volume,
        'placeables': [
            {
                'type': placeable.properties['type'],
                'label': placeable.get_name(),
                'slot': placeable.get_parent().get_name(),
                'calibrated': False
            }
            for placeable in get_containers(instrument)
        ]
    } for _, instrument in Robot.get_instance().get_instruments()]

    return data


@app.route('/home/<axis>')
def home(axis):
    result = robot.home(axis, now=True)
    return flask.jsonify({
        'status': 200,
        'data': result
    })


@app.route('/jog', methods=["POST"])
def jog():
    coords = request.json
    if coords.get("a") or coords.get("b"):
        result = robot._driver.move_plunger(mode="relative", **coords)
    else:
        result = robot.move_head(mode="relative", **coords)

    return flask.jsonify({
        'status': 200,
        'data': result
    })


@app.route('/move_to_slot', methods=["POST"])
def move_to_slot():
    slot = request.json.get("slot")
    instrument = request.json.get("instrument")
    location = robot._deck[slot].top(200)
    result = robot.move_to(location, instrument=instrument)

    return flask.jsonify({
        'status': 200,
        'data': result
    })


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
