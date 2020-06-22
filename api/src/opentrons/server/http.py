import logging

log = logging.getLogger(__name__)


class HTTPServer(object):
    def __init__(self, app):
        self.app = app
