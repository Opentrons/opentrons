class DurationEstimatorException(Exception):
    def __init__(self, message):
        super(Exception, self).__init__(
            f"Error encountered while estimating protocol duration: '{message}'"
        )
