import logging

from .endpoints import (control)

log = logging.getLogger(__name__)


class HTTPServer(object):
    def __init__(self, app):
        self.app = app

        self.app.router.add_get(
            '/pipettes', control.get_attached_pipettes)
        self.app.router.add_get(
            '/robot/positions', control.position_info)
        self.app.router.add_post(
            '/robot/move', control.move)
        self.app.router.add_post(
            '/robot/home', control.home)
