

class V1HandlerError(Exception):
    def __init__(self, status_code, message):
        self.status_code = status_code
        self.message = message
