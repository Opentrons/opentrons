class NextMixin(object):
    def __next__(self, well):
        return well.parent.get_next_well(well)