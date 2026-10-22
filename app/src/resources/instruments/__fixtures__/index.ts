// mock HTTP responses for pipettes endpoints

import type { AttachedPipette, PipetteData } from '@opentrons/api-client'
import type { PipetteInformation } from '/app/resources/instruments/types'

export const mockRobot = { name: 'robot', ip: '127.0.0.1', port: 31950 }

// fetch pipette fixtures

export const mockAttachedPipette: Omit<AttachedPipette, 'modelSpecs'> = {
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

export const mockLeftSpecs: any = {
  displayName: 'Left Pipette',
  name: 'mock_left',
  backCompatNames: ['mock_left_legacy'],
}

export const mockLeftLegacySpecs: any = {
  displayName: 'Left Pipette Legacy',
  name: 'mock_left_legacy',
}

export const mockRightSpecs: any = {
  displayName: 'Right Pipette',
  name: 'mock_right',
}

export const mockPipetteData1Channel: PipetteData = {
  data: {
    channels: 1,
    min_volume: 1,
    max_volume: 50,
    calibratedOffset: {
      offset: { x: 0, y: 2, z: 1 },
      source: 'default',
      last_modified: '2020-08-25T20:25',
    },
  },
  instrumentModel: 'p1000_single_v3.0',
  instrumentName: 'p1000_single_flex',
  instrumentType: 'pipette',
  mount: 'left',
  serialNumber: 'abc',
  subsystem: 'pipette_left',
  ok: true,
  state: {
    tipDetected: false,
  },
}
export const mockAttachedPipetteInformation: PipetteInformation = {
  ...mockPipetteData1Channel,
  displayName: 'Flex 1-Channel 1000 µL',
}

export const mockPipetteData8Channel: PipetteData = {
  data: {
    channels: 8,
    min_volume: 1,
    max_volume: 50,
    calibratedOffset: {
      offset: { x: 0, y: 2, z: 1 },
      source: 'default',
      last_modified: '2020-08-25T20:25',
    },
  },
  firmwareVersion: '12',
  instrumentModel: 'p1000_multi_v3.0',
  instrumentName: 'p1000_multi_flex',
  instrumentType: 'pipette',
  mount: 'right',
  serialNumber: 'cba',
  subsystem: 'pipette_right',
  ok: true,
  state: {
    tipDetected: false,
  },
}
export const mock8ChannelAttachedPipetteInformation: PipetteInformation = {
  ...mockPipetteData8Channel,
  displayName: 'Flex 8-Channel 1000 µL',
}

export const mockPipetteData96Channel: PipetteData = {
  data: {
    channels: 96,
    min_volume: 1,
    max_volume: 50,
    calibratedOffset: {
      offset: { x: 0, y: 2, z: 1 },
      source: 'default',
      last_modified: '2020-08-25T20:25',
    },
  },
  instrumentModel: 'p1000_96_v1',
  instrumentName: 'p1000_96',
  instrumentType: 'pipette',
  mount: 'left',
  serialNumber: 'cba',
  subsystem: 'pipette_left',
  ok: true,
  state: {
    tipDetected: false,
  },
}
export const mock96ChannelAttachedPipetteInformation: PipetteInformation = {
  ...mockPipetteData96Channel,
  displayName: 'Flex 96-Channel 1000 µL',
}
