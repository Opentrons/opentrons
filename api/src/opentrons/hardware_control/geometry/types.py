class BoundingBox:
    offset: Point
    depth: float
    width: float
    height: float

    def __ge__(self, other_box):
      val1=self.ft*12+self.inch
      val2=x.ft*12+x.inch
      if val1>=val2:
          return True
      else:
          return False


class GripperBoundingBox(BoundingBox):
    jaw_center: float


class PipetteBoundingBox(BoundingBox):

    def height_by_generation():
        return None
