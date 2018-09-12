// user interface state module
// DEPRECATED

// TODO(mc, 2018-03-05): move these constants to pages/index.js
export const PANEL_NAMES = ['connect', 'upload', 'setup', 'run', 'more']

export const PANEL_PROPS_BY_NAME = {
  connect: {title: 'Robots'},
  upload: {title: 'Open Protocol'},
  setup: {title: 'Prepare for Run'},
  run: {title: 'Execute Run'},
  more: {title: 'Menu'},
}

export const PANELS = PANEL_NAMES.map((name) => ({
  name,
  ...PANEL_PROPS_BY_NAME[name],
}))
