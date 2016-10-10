import logging
import os
import sys
sys.path.insert(0, os.path.abspath('..'))

import flask
from flask import Flask, render_template
from flask_socketio import SocketIO

from opentrons_sdk.robot import Robot

from server.helpers import get_frozen_root
from server.process_manager import run_once


TEMPLATES_FOLDER = os.path.join(get_frozen_root() or '', 'templates')
STATIC_FOLDER = os.path.join(get_frozen_root() or '', 'static')

app = Flask(__name__,
            static_folder=STATIC_FOLDER,
            template_folder=TEMPLATES_FOLDER
            )
app.jinja_env.autoescape = False
socketio = SocketIO(app, async_mode='gevent')
robot = Robot.get_instance()

# welcome route for connecting to robot
@app.route("/")
def welcome():
    return render_template("index.html")


@app.route('/dist/<path:filename>')
def script_loader(filename):
    root = get_frozen_root() or app.root_path
    scripts_root_path = os.path.join(root, 'templates', 'dist')
    return flask.send_from_directory(scripts_root_path, filename)


# welcome route for uploading protocol
@app.route("/upload/<path:path>")
def upload(path):
    return render_template("upload.html")


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

    return flask.jsonify({
        'status': status,
        'data': data
    })


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
