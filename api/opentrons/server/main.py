import json
import logging
import os
import sys
import threading
import time
import argparse

import flask
from flask import Flask, send_from_directory, request
from flask_socketio import SocketIO
from flask_cors import CORS

from opentrons import robot, Robot, instruments, containers  # NOQA
from opentrons.util import trace, environment, state as robot_state
from opentrons.util.vector import VectorEncoder
from opentrons.drivers.smoothie_drivers.v2_0_0 import player


sys.path.insert(0, os.path.abspath('..'))  # NOQA
from opentrons.server import helpers
from opentrons.server.process_manager import run_once


STATIC_FOLDER = os.path.join(helpers.get_frozen_root() or '', 'templates')

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        'path', nargs='?',
        default=STATIC_FOLDER,
        help='UI Assets folder'
    )
    args = parser.parse_args()
    STATIC_FOLDER = os.path.abspath(args.path)


BACKGROUND_TASKS = {}

exit_threads = threading.Event()
exit_threads.clear()

app = Flask(
    __name__,
    static_url_path='',
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
    s = json.dumps(info, cls=VectorEncoder)
    name = json.loads(s).get('name')
    if name != 'move-finished' and name != 'move-to':
        socketio.emit('event', json.loads(s))


trace.EventBroker.get_instance().add(notify)


@app.route("/")
def serve_index():
    return send_from_directory(STATIC_FOLDER, 'index.html')


@app.route("/index.html")
def serve_index2():
    return send_from_directory(STATIC_FOLDER, 'index.html')


@app.route("/dist/<path:path>")
def serve_dist(path):
    print('Path: ' + path)
    return send_from_directory(os.path.join(STATIC_FOLDER, 'dist'), path)


@app.route("/assets/<path:path>")
def serve_assets(path):
    print('Assets: ' + path)
    return send_from_directory(os.path.join(STATIC_FOLDER, 'assets'), path)


@app.route("/exit")
def exit():
    # stop any active threads
    exit_threads.set()  # stop detached run thread
    app.robot.stop()  # stops attached run thread
    func = request.environ.get('werkzeug.server.shutdown')
    if func is None:
        sys.exit()
    func()
    return 'Server shutting down...'


def get_protocol_locals():
    from opentrons import robot, containers, instruments  # NOQA
    return locals()


@app.route("/upload", methods=["POST"])
def upload():
    # TODO: refactor and persist upload history?
    file = request.files.get('file')
    app.file = file
    app.filename = file.filename
    app.last_modified = request.form.get('lastModified')
    app.code = file.stream.read().decode()

    if not file:
        return flask.jsonify({
            'status': 'error',
            'data': 'File expected'
        })

    extension = file.filename.split('.')[-1].lower()

    api_response = {'errors': [], 'warnings': []}
    if extension == 'py':
        commands, error_msg = helpers.run_protocol(
            app.robot, app.code, mode='null')
        if error_msg:
            app.logger.exception('Protocol exec failed')
            app.logger.exception(error_msg)
            api_response['errors'] = [error_msg]
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
        calibrations = robot_state.get_state(app.robot)

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


@app.route("/load")
def load():
    status = "success"
    calibrations = None
    try:
        calibrations = robot_state.get_state(app.robot)
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
        # Generate a run log message for app simulation, this will interfere
        # with app progress since it relies on number of 'command-run' events
        # to determine progress
        socketio.emit('event', {
            'caller': 'ui',
            'mode': 'live',
            'name': 'command-run',
            'command_description': 'Protocol run initiated. Simulating...'
        })
        commands, error_msg = helpers.run_protocol(
            app.robot, app.code, mode='null')
        app.robot.cmds_total = len(commands) + 1  # acct for simulation event
        app.robot._commands = []
        app.robot.resume()

        start_time = time.time()
        cmds, error = helpers.run_protocol(app.robot, app.code, mode='live')
        end_time = time.time()

        if error:
            # run protocol to list of interacted placeables
            helpers.run_protocol(
                app.robot, app.code, mode='null')
            emit_notifications([error], 'danger')
        else:
            run_time = helpers.timestamp(end_time - start_time)
            result = "Run complete in {}".format(run_time)
            emit_notifications([result], 'success')
        socketio.emit('event', {'name': 'run-finished'})

    threading.Thread(target=_run, args=()).start()
    return flask.jsonify({'status': 'success', 'data': {}})


@app.route("/run_home", methods=["GET"])
def run_home():
    app.robot.home()
    return run()


def _detached_progress():
    while not exit_threads.is_set():
        res = app.robot._driver.smoothie_player.progress(timeout=20)
        if not res.get('file'):
            return
        percentage = '{}%'.format(round(res.get('percentage', 0) * 100, 2))

        def _seconds_to_string(sec):
            hours = int(sec / (60 * 60))
            hours = str(hours) if hours > 9 else '0{}'.format(hours)
            minutes = int(sec / 60) % 60
            minutes = str(minutes) if minutes > 9 else '0{}'.format(minutes)
            seconds = sec % 60
            seconds = str(seconds) if seconds > 9 else '0{}'.format(seconds)
            return (hours, minutes, seconds)

        h, m, s = _seconds_to_string(res.get('elapsed_time'))
        progress_data = 'Protocol {} Complete - Elapsed Time {}:{}:{}'.format(
            percentage, h, m, s)

        if res.get('estimated_time'):
            h, m, s = _seconds_to_string(res.get('estimated_time'))
            progress_data += ' - Estimated Time Left {}:{}:{}'.format(h, m, s)

        d = {
            'caller': 'ui',
            'mode': 'live',
            'name': 'command-run',
            'command_description': progress_data
        }
        notify(d)


def _run_detached():
    try:
        p = player.SmoothiePlayer_2_0_0()

        d = {'caller': 'ui', 'mode': 'live', 'name': 'command-run'}
        d.update({
            'command_description': 'Simulating, please wait...'
        })
        notify(d)

        app.robot.smoothie_drivers['simulate_switches'].record_start(p)
        commands, error_msg = helpers.run_protocol(
            app.robot, app.code, mode='simulate_switches')
        app.robot.smoothie_drivers['simulate_switches'].record_stop()
        if error_msg:
            raise RuntimeError(error_msg)

        d.update({
            'command_description': 'Saving file to robot, please wait...'
        })
        notify(d)

        app.robot._driver.play(p)

        d.update({
            'command_description': 'Protocol running, unplug USB at any time.'
        })
        notify(d)
        d.update({
            'command_description': 'To stop, unplug USB and power robot OFF'
        })
        notify(d)

        _detached_progress()

    except Exception as e:
        emit_notifications([str(e)], 'danger')
    socketio.emit('event', {'name': 'run-finished'})


@app.route("/run_detached", methods=["GET"])
def run_detached():
    threading.Thread(target=_run_detached).start()
    return flask.jsonify({'status': 'success', 'data': {}})


@app.route("/run_home_detached", methods=["GET"])
def run_home_detached():
    app.robot.home()
    return run_detached()


@app.route("/pause", methods=["GET"])
def pause():
    result = app.robot.pause()
    emit_notifications(['Protocol paused'], 'info')
    return flask.jsonify({'status': 'success', 'data': result})


@app.route("/resume", methods=["GET"])
def resume():
    result = app.robot.resume()
    emit_notifications(['Protocol resumed'], 'info')

    return flask.jsonify({
        'status': 'success',
        'data': result
    })


@app.route("/cancel", methods=["GET"])
def stop():
    result = app.robot.stop()
    emit_notifications(['Protocol stopped'], 'info')

    return flask.jsonify({
        'status': 'success',
        'data': result
    })


@app.route("/halt", methods=["GET"])
def halt():
    result = app.robot.halt()
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
    return flask.jsonify({
        'ports': app.robot.get_serial_ports_list()
    })


# TODO: move to robot.get_state()
@app.route("/robot/serial/is_connected")
def is_connected():
    return flask.jsonify({
        'is_connected': app.robot.is_connected(),
        'port': app.robot.get_connected_port()
    })


# TODO: move to robot.get_state()
@app.route("/robot/get_coordinates")
def get_coordinates():
    return flask.jsonify({
        'coords': app.robot._driver.get_position().get("target")
    })


# TODO: move to robot.get_state()
@app.route("/robot/diagnostics")
def diagnostics():
    return flask.jsonify({
        'diagnostics': app.robot.diagnostics()
    })


# TODO: move to robot.get_state()
@app.route("/robot/versions")
def get_versions():
    return flask.jsonify({
        'versions': app.robot.versions()
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
        app.robot.disconnect()
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
        data = robot_state.get_state(app.robot)
    except Exception as e:
        emit_notifications([str(e)], 'danger')

    return flask.jsonify({
        'status': 'success',
        'data': data
    })


@app.route('/home/<axis>')
def home(axis):
    status = 'success'
    result = ''
    try:
        if axis == 'undefined' or axis == '' or axis.lower() == 'all':
            result = app.robot.home()
        else:
            result = app.robot.home(axis)
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
            x=-1, y=0, z=0, reference=app.robot._deck)
        _, _, robot_max_z = app.robot._driver.get_dimensions()

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


def _get_pipette_from_axis(axis):
    inst = app.robot._instruments[axis.upper()]
    inst.load_persisted_data()
    return inst


@app.route('/move_to_container', methods=["POST"])
def move_to_container():
    slot = request.json.get("slot")
    name = request.json.get("label")
    axis = request.json.get("axis")
    try:
        instrument = _get_pipette_from_axis(axis)
        container = app.robot._deck[slot].get_child_by_name(name)
        well_x, well_y, well_z = tuple(instrument.calibrator.convert(
            container[0],
            container[0].bottom()[1]))
        _, _, robot_max_z = app.robot._driver.get_dimensions()

        # move to max Z to avoid collisions while calibrating
        app.robot.move_head(z=robot_max_z)
        app.robot.move_head(x=well_x, y=well_y)
        app.robot.move_head(z=well_z)
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
        instrument = _get_pipette_from_axis(axis)
        instrument.reset_tip_tracking()

        # Note (Ahmed, Andy): Instead of picking up the tip with drop tip
        # we will go to the robots max Z height and then call pick up tip
        # this is becauase pipette.pick_up_tip() uses robot.move_to which uses
        # the last placeable the robot interacted with to get the max Z height
        # it should move to.

        # instrument.pick_up_tip()  # Do not use this until explicitly setting
        # X, Y, Z

        tip_placeable = instrument.tip_racks[0][0]
        tip_x, tip_y, tip_z = tuple(instrument.calibrator.convert(
            tip_placeable,
            tip_placeable.bottom()[1])
        )

        _, _, robot_max_z = app.robot._driver.get_dimensions()
        app.robot.move_head(z=robot_max_z)
        app.robot.move_head(x=tip_x, y=tip_y)
        instrument.pick_up_tip(tip_placeable)

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
        instrument = _get_pipette_from_axis(axis)
        instrument.reset_tip_tracking()

        # Note (Ahmed, Andy): Instead of dropping the tip with drop tip
        # we will go to the robots max Z height and then call pick up tip
        # this is because pipette.pick_up_tip() uses robot.move_to which uses
        # the last placeable the robot interacted with to get the max Z height
        # it should move to.

        # instrument.return_tip()  # Do not use this until explicitly setting
        # X, Y, Z

        tip_placeable = instrument.tip_racks[0][0]
        tip_x, tip_y, tip_z = tuple(instrument.calibrator.convert(
            tip_placeable,
            tip_placeable.bottom()[1])
        )

        _, _, robot_max_z = app.robot._driver.get_dimensions()
        app.robot.move_head(z=robot_max_z)
        app.robot.move_head(x=tip_x, y=tip_y)
        instrument.drop_tip(tip_placeable)

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
        instrument = _get_pipette_from_axis(axis)
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
        instrument = robot._instruments[axis.upper()]
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
        instrument = _get_pipette_from_axis(axis)
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
        instrument = _get_pipette_from_axis(axis)
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

    if axis_name not in app.robot._instruments:
        raise ValueError('Axis {} is not initialized'.format(axis_name))

    instrument = _get_pipette_from_axis(axis_name)

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
        calibrations = robot_state.get_state(app.robot)
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
    if axis_name not in app.robot._instruments:
        raise ValueError('Axis {} is not initialized'.format(axis_name))

    instrument = _get_pipette_from_axis(axis_name)
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

    calibrations = robot_state.get_state(app.robot)

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
    data_dir = environment.get_path('APP_DATA_DIR')
    IS_DEBUG = os.environ.get('DEBUG', '').lower() == 'true'
    if not IS_DEBUG:
        run_once(data_dir)
    _start_connection_watcher()

    from opentrons.server import log  # NOQA
    lg = logging.getLogger('opentrons-app')
    lg.info('Starting Flask Server')
    [app.logger.addHandler(handler) for handler in lg.handlers]

    print('Opentrons API server is serving UI from: ' + STATIC_FOLDER)
    socketio.run(
        app,
        debug=False,
        logger=False,
        use_reloader=False,
        log_output=False,
        engineio_logger=False,
        port=31950
    )


if __name__ == "__main__":
    start()
