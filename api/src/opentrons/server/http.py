import logging

from opentrons import config
from .endpoints import (control, update)


log = logging.getLogger(__name__)


class HTTPServer(object):
    def __init__(self, app):
        self.app = app
        self.app.router.add_get(
            '/modules', control.get_attached_modules)
        self.app.router.add_get(
            '/modules/{serial}/data', control.get_module_data)
        self.app.router.add_post(
            '/modules/{serial}', control.execute_module_command)
        if config.feature_flags.use_protocol_api_v2():
            self.app.router.add_post(
                '/modules/{serial}/update', update.update_module_firmware)
        else:
            self.app.router.add_post(
                '/modules/{serial}/update', update.cannot_update_firmware)

        self.app.router.add_get(
            '/pipettes', control.get_attached_pipettes)
        self.app.router.add_get(
            '/robot/positions', control.position_info)
        self.app.router.add_post(
            '/robot/move', control.move)
        self.app.router.add_post(
            '/robot/home', control.home)
