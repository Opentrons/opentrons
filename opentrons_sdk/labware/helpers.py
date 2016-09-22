class NextMixin(object):
    def __next__(self):
        return self.parent.get_next_well(self)