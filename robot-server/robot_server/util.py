from datetime import datetime


class duration:
    """Context manager to mark start and end times of a block"""

    def __enter__(self):
        self.start = datetime.utcnow()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.end = datetime.utcnow()
