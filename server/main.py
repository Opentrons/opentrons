import logging
import os
import sys
import threading
import json
import time

import flask
from flask import Flask, render_template, request
from flask_socketio import SocketIO
from flask_cors import CORS

from opentrons.robot import Robot
from opentrons.containers import placeable
from opentrons.util import trace
from opentrons.util.vector import VectorEncoder

sys.path.insert(0, os.path.abspath('..'))  # NOQA
from server import helpers
from server.process_manager import run_once


TEMPLATES_FOLDER = os.path.join(helpers.get_frozen_root() or '', 'templates')
STATIC_FOLDER = os.path.join(helpers.get_frozen_root() or '', 'static')
BACKGROUND_TASKS = {}

app = Flask(__name__,
            static_folder=STATIC_FOLDER,
            template_folder=TEMPLATES_FOLDER
            )

# app.config['LOGGER_NAME'] = 'opentrons-app'

CORS(app)
app.jinja_env.autoescape = False
app.config['ALLOWED_EXTENSIONS'] = set(['json', 'py'])
socketio = SocketIO(app, async_mode='gevent')
robot = Robot.get_instance()


def notify(info):
    s = json.dumps(info, cls=VectorEncoder)
    socketio.emit('event', json.loads(s))


trace.EventBroker.get_instance().add(notify)


@app.route("/")
def welcome():
    return render_template("index.html")


def load_python(stream):
    global robot

    code = helpers.convert_byte_stream_to_str(stream)
    api_response = {'errors': [], 'warnings': []}

    robot.reset()
    try:
        exec(code, globals(), locals())
        robot.simulate()
        if len(robot._commands) == 0:
            error = (
                "This protocol does not contain any commands for the robot."
            )
            api_response['errors'] = error
    except Exception as e:
        print(e)
        api_response['errors'] = [str(e)]


    api_response['warnings'] = robot.get_warnings() or []

    return api_response


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
        api_response = helpers.load_json(file.stream)
    else:
        return flask.jsonify({
            'status': 'error',
            'data': '{} is not a valid extension. Expected'
            '.py or .json'.format(extension)
        })

    calibrations = get_step_list()
    emit_notifications(api_response['errors'], 'danger')
    emit_notifications(api_response['warnings'], 'warning')

    return flask.jsonify({
        'status': 'success',
        'data': {
            'errors': api_response['errors'],
            'warnings': api_response['warnings'],
            'calibrations': calibrations
        }
    })


def emit_notifications(notifications, _type):
    for notification in notifications:
        socketio.emit('event', {
            'name': 'notification',
            'text': notification,
            'type': _type
        })


def _run_commands():
    start_time = time.time()
    global robot

    api_response = {'errors': [], 'warnings': []}

    try:
        robot.resume()
        robot.home()
        robot.run(caller='ui')
        if len(robot._commands) == 0:
            error = "This protocol does not contain any commands for the robot."
            api_response['errors'] = [error]
    except Exception as e:
        api_response['errors'] = [str(e)]

    api_response['warnings'] = robot.get_warnings() or []
    api_response['name'] = 'run exited'
    end_time = time.time()
    emit_notifications(api_response['warnings'], 'warning')
    emit_notifications(api_response['errors'], 'danger')
    seconds = end_time - start_time
    minutes, seconds = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)
    run_time = "%d:%02d:%02d" % (hours, minutes, seconds)
    result = "Run complete in {}".format(run_time)
    emit_notifications([result], 'success')


@app.route("/run", methods=["GET"])
def run():
    thread = threading.Thread(target=_run_commands)
    thread.start()

    return flask.jsonify({
        'status': 'success',
        'data': {}
    })


@app.route("/pause", methods=["GET"])
def pause():
    result = robot.pause()

    return flask.jsonify({
        'status': 'success',
        'data': result
    })


@app.route("/resume", methods=["GET"])
def resume():
    result = robot.resume()

    return flask.jsonify({
        'status': 'success',
        'data': result
    })


@app.route("/stop", methods=["GET"])
def stop():
    robot.stop()

    return flask.jsonify({
        'status': 'success',
        'data': ''
    })


@app.route('/dist/<path:filename>')
def script_loader(filename):
    root = helpers.get_frozen_root() or app.root_path
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


@app.route("/robot/get_coordinates")
def get_coordinates():
    return flask.jsonify({
        'coords': robot._driver.get_position().get("target")
    })


@app.route("/robot/diagnostics")
def get_diagnostics():
    return flask.jsonify({
        'diagnostics': robot.diagnostics()
    })


@app.route("/robot/versions")
def get_versions():
    return flask.jsonify({
        'versions': robot.versions()
    })


@app.route("/robot/serial/connect", methods=["POST"])
def connect_robot():
    port = request.json.get('port')
    options = request.json.get('options', {'limit_switches': False})

    status = 'success'
    data = None

    try:
        robot = Robot.get_instance()
        robot.connect(
            port, options=options)
    except Exception as e:
        # any robot version incompatibility will be caught here
        robot.disconnect()
        status = 'error'
        data = str(e)
        emit_notifications([data], 'danger')

    return flask.jsonify({
        'status': status,
        'data': data
    })


def _start_connection_watcher():
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


@app.route("/robot/serial/disconnect")
def disconnect_robot():
    status = 'success'
    data = None

    try:
        Robot.get_instance().disconnect()
    except Exception as e:
        status = 'error'
        data = str(e)
        emit_notifications([data], 'danger')

    return flask.jsonify({
        'status': status,
        'data': data
    })


@app.route("/instruments/placeables")
def placeables():
    try:
        data = get_step_list()
    except Exception as e:
        emit_notifications([str(e)], 'danger')

    return flask.jsonify({
        'status': 'success',
        'data': data
    })


def _sort_containers(container_list):
    """
    Returns the passed container list, sorted with tipracks first
    then alphabetically by name
    """
    _tipracks = []
    _other = []
    for c in container_list:
        _type = c.properties['type'].lower()
        if 'tip' in _type:
            _tipracks.append(c)
        else:
            _other.append(c)

    _tipracks = sorted(
        _tipracks,
        key=lambda c: c.get_name().lower()
    )
    _other = sorted(
        _other,
        key=lambda c: c.get_name().lower()
    )

    return _tipracks + _other


def _get_all_containers():
    """
    Returns all containers currently on the deck
    """
    all_containers = list()
    for slot in Robot.get_instance()._deck:
        if slot.has_children():
            container = slot.get_children_list()[0]
            all_containers.append(container)

    return _sort_containers(all_containers)


def _get_unique_containers(instrument):
    """
    Returns all associated containers for an instrument
    """
    unique_containers = set()
    for location in instrument.placeables:
        containers = [c for c in location.get_trace() if isinstance(
            c, placeable.Container)]
        unique_containers.add(containers[0])

    return _sort_containers(list(unique_containers))


def _check_if_calibrated(instrument, container):
    """
    Returns True if instrument holds calibration data for a Container
    """
    slot = container.get_parent().get_name()
    label = container.get_name()
    data = instrument.calibration_data
    if slot in data:
        if label in data[slot].get('children'):
            return True
    return False


def _check_if_instrument_calibrated(instrument):
    positions = instrument.positions
    for p in positions:
        if positions.get(p) is None:
            return False

    return True


def get_step_list():

    data = [{
        'axis': instrument.axis,
        'label': instrument.name,
        'top': instrument.positions['top'],
        'bottom': instrument.positions['bottom'],
        'blow_out': instrument.positions['blow_out'],
        'drop_tip': instrument.positions['drop_tip'],
        'max_volume': instrument.max_volume,
        'calibrated': _check_if_instrument_calibrated(instrument),
        'placeables': [
            {
                'type': container.properties['type'],
                'label': container.get_name(),
                'slot': container.get_parent().get_name(),
                'calibrated': _check_if_calibrated(instrument, container)
            }
            for container in _get_unique_containers(instrument)
        ]
    } for _, instrument in Robot.get_instance().get_instruments()]

    return data


@app.route('/home/<axis>')
def home(axis):
    status = 'success'
    result = ''
    try:
        if axis == 'undefined' or axis == '' or axis.lower() == 'all':
            result = robot.home(enqueue=False)
        else:
            result = robot.home(axis, enqueue=False)

    except Exception as e:
        result = str(e)
        status = 'error'
        emit_notifications([result], 'danger')

    return flask.jsonify({
        'status': status,
        'data': result
    })


@app.route('/jog', methods=["POST"])
def jog():
    coords = request.json

    status = 'success'
    result = ''
    try:
        if coords.get("a") or coords.get("b"):
            result = robot._driver.move_plunger(mode="relative", **coords)
        else:
            result = robot.move_head(mode="relative", **coords)
    except Exception as e:
        result = str(e)
        status = 'error'
        emit_notifications([result], 'danger')

    return flask.jsonify({
        'status': status,
        'data': result
    })


@app.route('/move_to_slot', methods=["POST"])
def move_to_slot():
    status = 'success'
    try:
        slot = request.json.get("slot")
        axis = request.json.get("axis")
        slot = robot._deck[slot]

        instrument = robot._instruments.get(axis.upper())

        relative_coord = slot.from_center(x=-1.0, y=0, z=0)
        _, _, tallest_z = slot.max_dimensions(slot)
        relative_coord += (0, 0, tallest_z)
        location = (slot, relative_coord)

        result = robot.move_to(
            location,
            enqueue=False,
            instrument=instrument
        )
    except Exception as e:
        result = str(e)
        status = 'error'
        emit_notifications([result], 'danger')


    return flask.jsonify({
        'status': status,
        'data': result
    })


@app.route('/move_to_container', methods=["POST"])
def move_to_container():
    slot = request.json.get("slot")
    name = request.json.get("label")
    axis = request.json.get("axis")
    try:
        instrument = robot._instruments[axis.upper()]
        container = robot._deck[slot].get_child_by_name(name)
        instrument.move_to(container[0].bottom(), enqueue=False)
    except Exception as e:
        emit_notifications([str(e)], 'danger')
        return flask.jsonify({
            'status': 'error',
            'data': str(e)
        })

    return flask.jsonify({
        'status': 'success',
        'data': ''
    })


@app.route('/pick_up_tip', methods=["POST"])
def pick_up_tip():
    try:
        axis = request.json.get("axis")
        robot = Robot.get_instance()
        instrument = robot._instruments[axis.upper()]
        instrument.reset_tip_tracking()
        instrument.pick_up_tip(enqueue=False)
    except Exception as e:
        emit_notifications([str(e)], 'danger')
        return flask.jsonify({
            'status': 'error',
            'data': str(e)
        })

    return flask.jsonify({
        'status': 'success',
        'data': ''
    })


@app.route('/drop_tip', methods=["POST"])
def drop_tip():
    try:
        axis = request.json.get("axis")
        robot = Robot.get_instance()
        instrument = robot._instruments[axis.upper()]
        instrument.drop_tip(enqueue=False)
    except Exception as e:
        emit_notifications([str(e)], 'danger')
        return flask.jsonify({
            'status': 'error',
            'data': str(e)
        })

    return flask.jsonify({
        'status': 'success',
        'data': ''
    })


@app.route('/move_to_plunger_position', methods=["POST"])
def move_to_plunger_position():
    position = request.json.get("position")
    axis = request.json.get("axis")
    try:
        instrument = robot._instruments[axis.upper()]
        instrument.motor.move(instrument.positions[position])
    except Exception as e:
        emit_notifications([str(e)], 'danger')
        return flask.jsonify({
            'status': 'error',
            'data': str(e)
        })

    return flask.jsonify({
        'status': 'success',
        'data': ''
    })


def _calibrate_placeable(container_name, axis_name):

    deck = robot._deck
    containers = deck.containers()
    axis_name = axis_name.upper()

    if container_name not in containers:
        raise ValueError('Container {} is not defined'.format(container_name))

    if axis_name not in robot._instruments:
        raise ValueError('Axis {} is not initialized'.format(axis_name))

    instrument = robot._instruments[axis_name]
    container = containers[container_name]

    well = container[0]
    pos = well.from_center(x=0, y=0, z=-1, reference=container)
    location = (container, pos)

    instrument.calibrate_position(location)
    return instrument.calibration_data


@app.route("/calibrate_placeable", methods=["POST"])
def calibrate_placeable():
    name = request.json.get("label")
    axis = request.json.get("axis")
    try:
        _calibrate_placeable(name, axis)
    except Exception as e:
        emit_notifications([str(e)], 'danger')
        return flask.jsonify({
            'status': 'error',
            'data': str(e)
        })

    calibrations = get_step_list()

    # TODO change calibration key to steplist
    return flask.jsonify({
        'status': 'success',
        'data': {
            'name': name,
            'axis': axis,
            'calibrations': calibrations
        }
    })


def _calibrate_plunger(position, axis_name):
    axis_name = axis_name.upper()
    if axis_name not in robot._instruments:
        raise ValueError('Axis {} is not initialized'.format(axis_name))

    instrument = robot._instruments[axis_name]
    if position not in instrument.positions:
        raise ValueError('Position {} is not on the plunger'.format(position))

    instrument.calibrate(position)


@app.route("/calibrate_plunger", methods=["POST"])
def calibrate_plunger():
    position = request.json.get("position")
    axis = request.json.get("axis")
    try:
        _calibrate_plunger(position, axis)
    except Exception as e:
        emit_notifications([str(e)], 'danger')
        return flask.jsonify({
            'status': 'error',
            'data': str(e)
        })

    calibrations = get_step_list()

    # TODO change calibration key to steplist
    return flask.jsonify({
        'status': 'success',
        'data': {
            'position': position,
            'axis': axis,
            'calibrations': calibrations
        }
    })


@app.route("/run-plan")
def get_run_plan():
    global robot
    return flask.jsonify({
        'status': 'success',
        'data': [i.description for i in robot._commands]
    })


# NOTE(Ahmed): DO NOT REMOVE socketio requires a confirmation from the
# front end that a connection was established, this route does that.
@socketio.on('connected')
def on_connect():
    print('connected to front end...')


@app.before_request
def log_before_request():
    logger = logging.getLogger('opentrons-app')
    log_msg = "[BR] {method} {url} | {data}".format(
        method=request.method,
        url=request.url,
        data=request.data,
    )
    logger.info(log_msg)


@app.after_request
def log_after_request(response):
    if response.mimetype == 'text/html':
        return response
    logger = logging.getLogger('opentrons-app')
    log_msg = "[AR] {data}".format(data=response.data)
    logger.info(log_msg)
    return response


if __name__ == "__main__":
    data_dir = os.environ.get('APP_DATA_DIR', os.getcwd())
    IS_DEBUG = os.environ.get('DEBUG', '').lower() == 'true'
    if not IS_DEBUG:
        run_once(data_dir)
    _start_connection_watcher()

    import log  # NOQA
    lg = logging.getLogger('opentrons-app')
    lg.info('Starting Flask Server')

    socketio.run(
        app,
        debug=False,
        logger=False,
        use_reloader=False,
        log_output=False,
        engineio_logger=True,
        port=31950
    )
