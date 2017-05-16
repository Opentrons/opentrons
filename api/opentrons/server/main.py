import datetime as dt
import json
import logging
import os
import sys
import threading
import time
import traceback

import dill
import flask
from flask import Flask, render_template, request
from flask_socketio import SocketIO
from flask_cors import CORS

from opentrons import robot, Robot  # NOQA
from opentrons.instruments import pipette
from opentrons.containers import placeable
from opentrons.util import trace
from opentrons.util.vector import VectorEncoder

sys.path.insert(0, os.path.abspath('..'))  # NOQA
from opentrons.server import helpers
from opentrons.server.process_manager import run_once


TEMPLATES_FOLDER = os.path.join(helpers.get_frozen_root() or '', 'templates')
STATIC_FOLDER = os.path.join(helpers.get_frozen_root() or '', 'templates')
BACKGROUND_TASKS = {}

app = Flask(__name__,
            static_folder=STATIC_FOLDER,
            template_folder=TEMPLATES_FOLDER,
            static_url_path=''
            )

# TODO: These globals are terrible and they must go away
# Attach all globals to flask app
app.robot = robot
app.file_stream = None
app.current_protocol_step_list = None  # current_protocol_step_list
app.filename = 'N/A'  # filename
app.last_modified = 'N/A'  # last_modified


CORS(app)
app.jinja_env.autoescape = False
app.config['ALLOWED_EXTENSIONS'] = set(['py'])
socketio = SocketIO(app, async_mode='gevent')


def notify(info):
    print('[notify]', info)
    s = json.dumps(info, cls=VectorEncoder)
    name = json.loads(s).get('name')
    if name != 'move-finished' and name != 'move-to':
        socketio.emit('event', json.loads(s))


trace.EventBroker.get_instance().add(notify)


@app.route("/")
def welcome():
    return render_template("index.html")


@app.route("/exit")
def exit():
    sys.exit()


def get_protocol_locals():
    from opentrons import robot, containers, instruments  # NOQA
    return locals()


def load_python(code : str):
    robot = app.robot
    api_response = {'errors': [], 'warnings': []}

    robot.reset()

    """
    TODO: a perhaps cleaner work around to jailing certain robot
    methods during runtime is to use a flag and make decision as to whether
    or not they should run. Optionally we can decorate these methods. e.g.:

    @not_run_safe
    def foo(self, args):
       pass

    patched_robot, restore_patched_robot = (
        helpers.get_upload_proof_robot(robot)
    )
    """
    try:
        app.robot.set_connection('simulate')
        app.robot.reset()
        exec(code, globals())
    except Exception as e:
        app.logger.exception('Protocol exec failed')
        tb = e.__traceback__
        stack_list = traceback.extract_tb(tb)
        _, line, name, text = stack_list[-1]
        if 'exec' in text:
            text = None
        raise Exception(
            'Error in protocol file line {} : {}\n{}'.format(
                line,
                str(e),
                text or ''
            )
        )

    if len(robot._commands) == 0:
        error = (
            "This protocol does not contain any commands for the robot."
        )
        api_response['errors'] = [error]


    return api_response


@app.route("/upload", methods=["POST"])
def upload():
    # TODO: refactor and persist upload history?
    file = request.files.get('file')
    app.file = file
    app.filename = file.filename
    app.last_modified = request.form.get('lastModified')
    app.code = helpers.convert_byte_stream_to_str(file.stream)

    if not file:
        return flask.jsonify({
            'status': 'error',
            'data': 'File expected'
        })

    extension = file.filename.split('.')[-1].lower()

    api_response = None
    if extension == 'py':
        api_response = load_python(app.code)
    else:
        return flask.jsonify({
            'status': 'error',
            'data': '{} is not a valid extension. Expected'
            '.py or .json'.format(extension)
        })

    if len(api_response['errors']) > 0:
        # TODO: no need for both http response and socket emit
        emit_notifications(api_response['errors'], 'danger')
        status = 'error'
        calibrations = []
    else:
        # TODO: no need for both http response and socket emit
        emit_notifications(
            ["Successfully uploaded {}".format(file.filename)], 'success')
        status = 'success'
        calibrations = create_step_list()

    return flask.jsonify({
        'status': status,
        'data': {
            'errors': api_response['errors'],
            'warnings': api_response['warnings'],
            'calibrations': calibrations,
            'fileName': app.filename,
            'lastModified': app.last_modified
        }
    })


@app.route("/upload-jupyter", methods=["POST"])
def upload_jupyter():
    robot = app.robot

    try:
        jupyter_robot = dill.loads(request.data)
        # These attributes need to be persisted from existing robot
        jupyter_robot._driver = robot._driver
        jupyter_robot.smoothie_drivers = robot.smoothie_drivers
        jupyter_robot.can_pop_command = robot.can_pop_command
        app.robot = jupyter_robot

        # Reload instrument calibrations
        [instr.load_persisted_data()
            for _, instr in jupyter_robot.get_instruments()]
        [instr.update_calibrator()
            for _, instr in jupyter_robot.get_instruments()]

        app.current_protocol_step_list = None  # NOQA
        calibrations = update_step_list()
        app.filename = 'JUPYTER UPLOAD'
        app.last_modified = dt.datetime.now().strftime('%a %b %d %Y')
        upload_data = {
            'calibrations': calibrations,
            'fileName': app.filename.title(),
            'lastModified': app.last_modified
        }
        app.logger.info('Successfully deserialized robot for jupyter upload')
        socketio.emit('event', {'data': upload_data, 'name': 'jupyter-upload'})
    except Exception as e:
        app.logger.exception('Failed to properly deserialize jupyter upload')
        print(e)

    return flask.jsonify({'status': 'success', 'data': None})


@app.route("/load")
def load():
    status = "success"
    calibrations = None
    try:
        calibrations = update_step_list()
    except Exception as e:
        emit_notifications([str(e)], "danger")
        status = 'error'

    return flask.jsonify({
        'status': status,
        'data': {
            'calibrations': calibrations,
            'fileName': app.filename,
            'lastModified': app.last_modified
        }
    })


def emit_notifications(notifications, _type):
    for notification in notifications:
        socketio.emit('event', {
            'name': 'notification',
            'text': notification,
            'type': _type
        })


@app.route("/run", methods=["GET"])
def run():
    def _run():
        commands = helpers.simulate_protocol(app.robot, app.code)
        robot.mode = 'live'
        robot.cmds_total = len(commands)
        robot._commands = []
        robot.resume()

        start_time = time.time()
        load_python(app.code)
        end_time = time.time()

        run_time = helpers.timestamp(end_time - start_time)
        result = "Run complete in {}".format(run_time)
        emit_notifications([result], 'success')
        socketio.emit('event', {'name': 'run-finished'})
    threading.Thread(target=_run, args=()).start()
    return flask.jsonify({'status': 'success', 'data': {}})


@app.route("/run_home", methods=["GET"])
def run_home():
    robot = app.robot
    robot.home()
    return run()


@app.route("/pause", methods=["GET"])
def pause():
    result = robot.pause()
    emit_notifications(['Protocol paused'], 'info')
    return flask.jsonify({'status': 'success', 'data': result})


@app.route("/resume", methods=["GET"])
def resume():
    result = robot.resume()
    emit_notifications(['Protocol resumed'], 'info')

    return flask.jsonify({
        'status': 'success',
        'data': result
    })


@app.route("/cancel", methods=["GET"])
def stop():
    result = robot.stop()
    emit_notifications(['Protocol stopped'], 'info')

    return flask.jsonify({
        'status': 'success',
        'data': result
    })


@app.route("/halt", methods=["GET"])
def halt():
    result = robot.halt()
    emit_notifications(
        ['Robot halted suddenly, please HOME ALL before running again'],
        'info'
    )

    return flask.jsonify({
        'status': 'success',
        'data': result
    })


@app.route('/dist/<path:filename>')
def script_loader(filename):
    root = helpers.get_frozen_root() or app.root_path
    scripts_root_path = os.path.join(root, 'templates', 'dist')
    return flask.send_from_directory(
        scripts_root_path, filename, mimetype='application/javascript'
    )


# TODO: move to robot.get_state()
@app.route("/robot/serial/list")
def get_serial_ports_list():
    robot = app.robot
    return flask.jsonify({
        'ports': robot.get_serial_ports_list()
    })


# TODO: move to robot.get_state()
@app.route("/robot/serial/is_connected")
def is_connected():
    robot = app.robot
    return flask.jsonify({
        'is_connected': robot.is_connected(),
        'port': robot.get_connected_port()
    })


# TODO: move to robot.get_state()
@app.route("/robot/get_coordinates")
def get_coordinates():
    robot = app.robot
    return flask.jsonify({
        'coords': robot._driver.get_position().get("target")
    })


# TODO: move to robot.get_state()
@app.route("/robot/diagnostics")
def diagnostics():
    robot = app.robot
    return flask.jsonify({
        'diagnostics': robot.diagnostics()
    })


# TODO: move to robot.get_state()
@app.route("/robot/versions")
def get_versions():
    robot = app.robot
    return flask.jsonify({
        'versions': robot.versions()
    })


@app.route("/app_version")
def app_version():
    return flask.jsonify({
        'version': os.environ.get("appVersion")
    })


@app.route("/robot/serial/connect", methods=["POST"])
def connectRobot():
    port = request.json.get('port')
    options = request.json.get('options', {'limit_switches': False})

    status = 'success'
    data = None

    try:
        app.robot.connect(port, options=options)
    except Exception as e:
        # any robot version incompatibility will be caught here
        robot.disconnect()
        status = 'error'
        data = str(e)
        if "versions are incompatible" in data:
            data += ". To upgrade, go to docs.opentrons.com"
        emit_notifications([data], 'danger')

    return flask.jsonify({
        'status': status,
        'data': data
    })


# FIXME: this is currently broken
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
                    'is_connected': app.robot.is_connected()
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
def disconnectRobot():
    status = 'success'
    data = None

    try:
        app.robot.disconnect()
        emit_notifications(["Successfully disconnected"], 'info')
    except Exception as e:
        status = 'error'
        data = str(e)
        emit_notifications([data], 'danger')

    return flask.jsonify({
        'status': status,
        'data': data
    })


# TODO: move to robot.get_state()
@app.route("/instruments/placeables")
def placeables():
    data = None
    try:
        data = update_step_list()
    except Exception as e:
        emit_notifications([str(e)], 'danger')

    return flask.jsonify({
        'status': 'success',
        'data': data
    })


# TODO: move to robot.get_state()
def _sort_containers(container_list):
    """
    Returns the passed container list, sorted with tipracks first
    then alphabetically by name
    """
    _tipracks = []
    _other = []
    for c in container_list:
        _type = c.get_type().lower()
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


# TODO: move to robot.get_state()
def _get_all_pipettes():
    pipette_list = []
    for _, p in app.robot.get_instruments():
        if isinstance(p, pipette.Pipette):
            pipette_list.append(p)
    return sorted(
        pipette_list,
        key=lambda p: p.name.lower()
    )


# TODO: move to robot.get_state()
def _get_all_containers():
    """
    Returns all containers currently on the deck
    """
    all_containers = list()
    for slot in app.robot._deck:
        if slot.has_children():
            all_containers += slot.get_children_list()

    return _sort_containers(all_containers)


# TODO: move to robot.get_state()
def _get_unique_containers(instrument):
    """
    Returns all associated containers for an instrument
    """
    unique_containers = set()
    for location in instrument.placeables:
        if isinstance(location, placeable.WellSeries):
            location = location[0]
        for c in location.get_trace():
            if isinstance(c, placeable.Container):
                unique_containers.add(c)

    return _sort_containers(list(unique_containers))


# TODO: move to robot.get_state()
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


# TODO: move to robot.get_state()
def _check_if_instrument_calibrated(instrument):
    # TODO: rethink calibrating instruments other than Pipette
    if not isinstance(instrument, pipette.Pipette):
        return True

    positions = instrument.positions
    for p in positions:
        if positions.get(p) is None:
            return False

    return True


# TODO: move to robot.get_state()
def _get_container_from_step(step):
    """
    Retruns the matching Container for a given placeable step in the step-list
    """
    all_containers = _get_all_containers()
    for container in all_containers:
        match = [
            container.get_name() == step['label'],
            container.get_parent().get_name() == step['slot'],
            container.get_type() == step['type']

        ]
        if all(match):
            return container
    return None


# TODO: move to robot.get_state()
def create_step_list():
    global current_protocol_step_list
    try:
        current_protocol_step_list = [{
            'axis': instrument.axis,
            'label': instrument.name,
            'channels': instrument.channels,
            'placeables': [
                {
                    'type': container.get_type(),
                    'label': container.get_name(),
                    'slot': container.get_parent().get_name()
                }
                for container in _get_unique_containers(instrument)
            ]
        } for instrument in _get_all_pipettes()]
    except Exception as e:
        app.logger.exception('Error creating step list')
        emit_notifications([str(e)], 'danger')

    return update_step_list()


# TODO: This needs thought
def update_step_list():
    # TODO: This global stuff really needs to go away...
    global current_protocol_step_list, robot
    if current_protocol_step_list is None:
        create_step_list()
    try:
        for step in current_protocol_step_list:
            t_axis = str(step['axis']).upper()
            instrument = app.robot._instruments[t_axis]
            step.update({
                'top': instrument.positions['top'],
                'bottom': instrument.positions['bottom'],
                'blow_out': instrument.positions['blow_out'],
                'drop_tip': instrument.positions['drop_tip'],
                'max_volume': instrument.max_volume,
                'calibrated': _check_if_instrument_calibrated(instrument)
            })

            for placeable_step in step['placeables']:
                c = _get_container_from_step(placeable_step)
                if c:
                    placeable_step.update({
                        'calibrated': _check_if_calibrated(instrument, c)
                    })
    except Exception as e:
        emit_notifications([str(e)], 'danger')

    return current_protocol_step_list


@app.route('/home/<axis>')
def home(axis):
    status = 'success'
    result = ''
    try:
        if axis == 'undefined' or axis == '' or axis.lower() == 'all':
            result = app.robot.home(enqueue=False)
        else:
            result = app.robot.home(axis, enqueue=False)
        emit_notifications(["Successfully homed"], 'info')
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
    global robot
    coords = request.json

    status = 'success'
    result = ''
    try:
        if coords.get("a") or coords.get("b"):
            result = app.robot._driver.move_plunger(mode="relative", **coords)
        else:
            result = app.robot.move_head(mode="relative", **coords)
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
    result = ''
    try:
        slot = request.json.get("slot")
        slot = app.robot._deck[slot]

        slot_x, slot_y, _ = slot.from_center(
            x=-1, y=0, z=0, reference=robot._deck)
        _, _, robot_max_z = robot._driver.get_dimensions()

        app.robot.move_head(z=robot_max_z)
        app.robot.move_head(x=slot_x, y=slot_y)
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
        instrument = app.robot._instruments[axis.upper()]
        container = app.robot._deck[slot].get_child_by_name(name)
        well_x, well_y, well_z = tuple(instrument.calibrator.convert(
            container[0],
            container[0].bottom()[1]))
        _, _, robot_max_z = robot._driver.get_dimensions()

        # move to max Z to avoid collisions while calibrating
        robot.move_head(z=robot_max_z)
        robot.move_head(x=well_x, y=well_y)
        robot.move_head(z=well_z)
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
        instrument = app.robot._instruments[axis.upper()]
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
        instrument = app.robot._instruments[axis.upper()]
        instrument.return_tip(enqueue=False)
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
        instrument = app.robot._instruments[axis.upper()]
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


@app.route('/aspirate', methods=["POST"])
def aspirate_from_current_position():
    axis = request.json.get("axis")
    try:
        # this action mimics 1.2 app experience
        # but should be re-thought to take advantage of API features
        instrument = app.robot._instruments[axis.upper()]
        robot.move_head(z=20, mode='relative')
        instrument.motor.move(instrument.positions['blow_out'])
        instrument.motor.move(instrument.positions['bottom'])
        robot.move_head(z=-20, mode='relative')
        instrument.motor.move(instrument.positions['top'])
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


@app.route('/dispense', methods=["POST"])
def dispense_from_current_position():
    axis = request.json.get("axis")
    try:
        # this action mimics 1.2 app experience
        # but should be re-thought to take advantage of API features
        instrument = app.robot._instruments[axis.upper()]
        instrument.motor.move(instrument.positions['blow_out'])
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


@app.route('/set_max_volume', methods=["POST"])
def set_max_volume():
    volume = request.json.get("volume")
    axis = request.json.get("axis")
    try:
        instrument = app.robot._instruments[axis.upper()]
        instrument.set_max_volume(int(volume))
        msg = "Max volume set to {0}ul on the {1} axis".format(volume, axis)
        emit_notifications([msg], 'success')
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


def _calibrate_placeable(container_name, parent_slot, axis_name):
    deck = app.robot._deck
    this_container = deck[parent_slot].get_child_by_name(container_name)
    axis_name = axis_name.upper()

    if not this_container:
        raise ValueError('Container {0} not found in slot {1}'.format(
            container_name, parent_slot))

    if axis_name not in robot._instruments:
        raise ValueError('Axis {} is not initialized'.format(axis_name))

    instrument = app.robot._instruments[axis_name]

    well = this_container[0]
    pos = well.from_center(x=0, y=0, z=-1, reference=this_container)
    location = (this_container, pos)

    instrument.calibrate_position(location)
    return instrument.calibration_data


@app.route("/calibrate_placeable", methods=["POST"])
def calibrate_placeable():
    name = request.json.get("label")
    axis = request.json.get("axis")
    slot = request.json.get("slot")
    try:
        _calibrate_placeable(name, slot, axis)
        calibrations = update_step_list()
        emit_notifications([
            'Saved {0} for the {1} axis'.format(name, axis)], 'success')
    except Exception as e:
        emit_notifications([str(e)], 'danger')
        return flask.jsonify({
            'status': 'error',
            'data': str(e)
        })

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
        emit_notifications(
            ['Saved {0} on the {1} pipette'.format(position, axis)], 'success')
    except Exception as e:
        emit_notifications([str(e)], 'danger')
        return flask.jsonify({
            'status': 'error',
            'data': str(e)
        })

    calibrations = update_step_list()

    # TODO change calibration key to steplist
    return flask.jsonify({
        'status': 'success',
        'data': {
            'position': position,
            'axis': axis,
            'calibrations': calibrations
        }
    })


# NOTE(Ahmed): DO NOT REMOVE socketio requires a confirmation from the
# front end that a connection was established, this route does that.
@socketio.on('connected')
def on_connect():
    app.logger.info('Socketio connected to front end...')


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
    response.direct_passthrough = False
    if response.mimetype in ('text/html', 'application/javascript'):
        return response
    logger = logging.getLogger('opentrons-app')
    log_msg = "[AR] {data}".format(data=response.data)
    logger.info(log_msg)
    return response


def start():
    data_dir = os.environ.get('APP_DATA_DIR', os.getcwd())
    IS_DEBUG = os.environ.get('DEBUG', '').lower() == 'true'
    if not IS_DEBUG:
        run_once(data_dir)
    _start_connection_watcher()

    from opentrons.server import log  # NOQA
    lg = logging.getLogger('opentrons-app')
    lg.info('Starting Flask Server')
    [app.logger.addHandler(handler) for handler in lg.handlers]

    socketio.run(
        app,
        debug=True,
        logger=False,
        use_reloader=False,
        log_output=False,
        engineio_logger=False,
        port=31950
    )



if __name__ == "__main__":
    start()
