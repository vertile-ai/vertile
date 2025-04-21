class InvalidArgumentError(Exception):
    def __init__(self, source, message="Invalid argument provided"):
        self.message = message
        self.source = source
        super().__init__(self.message)
