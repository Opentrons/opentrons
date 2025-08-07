const MODE_BAR_BUTTONS_TO_REMOVE = [
  'zoom2d',
  'pan2d',
  'autoScale2d',
  'hoverClosestCartesian',
  'toImage',
  'lasso2d',
  'select2d',
  'toggleHover',
  'zoomIn2d',
  'zoomOut2d',
]

const CONFIG_EDITS = {
  titleText: false,
  axisTitleText: false,
  legendText: false,
  colorbarTitleText: false,
  shapePosition: true,
  shapeEdit: false,
  annotationText: false,
  annotationPosition: false,
}

const WIDTH_PX = 600
const HEIGHT_PX = 600

const MARKER_SIZE = 35
const MARKER_OPACITY = 0
const LINE_WIDTH = 2

export const AXIS_OFFSET_PERCENTAGE = 0.05
export const POINT_DIAMETER_SCALAR = 0.02

export const CONFIG = {
  editable: true,
  displayModeBar: true,
  modeBarButtonsToRemove: MODE_BAR_BUTTONS_TO_REMOVE,
  edits: CONFIG_EDITS,
}

export const BASE_LAYOUT = {
  width: WIDTH_PX,
  height: HEIGHT_PX,
  hovermode: 'closest',
  dragmode: false,
}

export const BASE_DATA = {
  mode: 'lines+markers',
  type: 'scatter',
  marker: {
    size: MARKER_SIZE,
    opacity: MARKER_OPACITY,
  },
  line: { width: LINE_WIDTH },
  showlegend: false,
  hoverinfo: 'none',
}
