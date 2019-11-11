// @flow
// mock HTTP responses for pipettes endpoints

export const mockRobot = { name: 'robot', ip: '127.0.0.1', port: 31950 }

export const mockAttachedPipette = {
  id: 'abc',
  name: 'p300_single_gen2',
  model: 'p300_single_v2.0',
  tip_length: 42,
  mount_axis: 'c',
  plunger_axis: 'd',
}

export const mockFetchPipettesSuccess = {
  host: mockRobot,
  method: 'GET',
  path: '/pipettes',
  ok: true,
  status: 200,
  body: {
    left: {
      id: null,
      name: null,
      model: null,
      mount_axis: 'a',
      plunger_axis: 'b',
    },
    right: mockAttachedPipette,
  },
}

export const mockFetchPipettesSuccessMeta = {
  method: 'GET',
  path: '/pipettes',
  ok: true,
  status: 200,
}

export const mockFetchPipettesFailure = {
  host: mockRobot,
  method: 'GET',
  path: '/pipettes',
  ok: false,
  status: 500,
  body: { message: 'AH' },
}

export const mockFetchPipettesFailureMeta = {
  method: 'GET',
  path: '/pipettes',
  ok: false,
  status: 500,
}
