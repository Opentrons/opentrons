// @flow
// mock HTTP responses for pipettes endpoints

import type { PipetteSettings } from '../types'

export const mockRobot = { name: 'robot', ip: '127.0.0.1', port: 31950 }

// fetch pipette fixtures

export const mockAttachedPipette = {
  id: 'abc',
  name: 'p300_single_gen2',
  model: 'p300_single_v2.0',
  tip_length: 42,
  mount_axis: 'c',
  plunger_axis: 'd',
}

export const mockUnattachedPipette = {
  id: null,
  name: null,
  model: null,
  mount_axis: 'a',
  plunger_axis: 'b',
}

export const mockFetchPipettesSuccessMeta = {
  method: 'GET',
  path: '/pipettes',
  ok: true,
  status: 200,
}

export const mockFetchPipettesSuccess = {
  ...mockFetchPipettesSuccessMeta,
  host: mockRobot,
  body: {
    left: mockUnattachedPipette,
    right: mockAttachedPipette,
  },
}

export const mockFetchPipettesFailureMeta = {
  method: 'GET',
  path: '/pipettes',
  ok: false,
  status: 500,
}

export const mockFetchPipettesFailure = {
  ...mockFetchPipettesFailureMeta,
  host: mockRobot,
  body: { message: 'AH' },
}

// fetch pipette settings fixtures

export const mockPipetteSettings: PipetteSettings = {
  info: { name: 'p300_single_gen2', model: 'p300_single_v2.0' },
  fields: { [('fieldId': string)]: { value: 42, default: 42 } },
}

export const mockFetchPipetteSettingsSuccessMeta = {
  method: 'GET',
  path: '/pipettes/settings',
  ok: true,
  status: 200,
}

export const mockFetchPipetteSettingsSuccess = {
  ...mockFetchPipetteSettingsSuccessMeta,
  host: mockRobot,
  body: ({ abc: mockPipetteSettings }: {
    [string]: PipetteSettings,
    ...,
  }),
}

export const mockFetchPipetteSettingsFailureMeta = {
  method: 'GET',
  path: '/pipettes/settings',
  ok: false,
  status: 500,
}

export const mockFetchPipetteSettingsFailure = {
  ...mockFetchPipetteSettingsFailureMeta,
  host: mockRobot,
  body: { message: 'AH' },
}

// update pipette settings fixtures

export const mockUpdatePipetteSettingsSuccessMeta = {
  method: 'PATCH',
  path: '/pipettes/settings/abc',
  ok: true,
  status: 200,
}

export const mockUpdatePipetteSettingsSuccess = {
  ...mockUpdatePipetteSettingsSuccessMeta,
  host: mockRobot,
  body: { fields: mockPipetteSettings.fields },
}

export const mockUpdatePipetteSettingsFailureMeta = {
  method: 'PATCH',
  path: '/pipettes/settings/abc',
  ok: false,
  status: 500,
}

export const mockUpdatePipetteSettingsFailure = {
  ...mockUpdatePipetteSettingsFailureMeta,
  host: mockRobot,
  body: { message: 'AH' },
}
