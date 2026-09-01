import { describe, expect, it } from 'vitest'

import {
  A1_NOZZLE,
  ALL,
  COLUMN,
  E1_NOZZLE,
  F1_NOZZLE,
  PARTIAL_COLUMN,
  QUADRANT,
  ROW,
  SINGLE,
} from '@opentrons/shared-data'

import { getActiveNozzleAmount } from '../getActiveNozzleAmount'

import type { PipetteV2Specs } from '@opentrons/shared-data'

const MOCK_P96_SPECS: PipetteV2Specs = {
  channels: 96,
  defaultTipracks: [],
  displayCategory: 'GEN2',
  id: 'p96',
  model: 'p96',
  name: 'p96',
  nominalMaxVolumeUl: 10,
  supportedTips: [],
  tipLength: 50,
  liquids: {
    default: {
      maxVolume: 10,
      minVolume: 1,
    },
  },
} as any
const MOCK_P8_SPECS: PipetteV2Specs = {
  channels: 8,
  defaultTipracks: [],
  displayCategory: 'GEN2',
  id: 'p8',
  model: 'p8',
  name: 'p8',
  nominalMaxVolumeUl: 10,
  supportedTips: [],
  tipLength: 50,
  liquids: {
    default: {
      maxVolume: 10,
      minVolume: 1,
    },
  },
} as any

const MOCK_P1_SPECS: PipetteV2Specs = {
  channels: 1,
  defaultTipracks: [],
  displayCategory: 'GEN2',
  id: 'p1',
  model: 'p1',
  name: 'p1',
  nominalMaxVolumeUl: 10,
  supportedTips: [],
  tipLength: 50,
  liquids: {
    default: {
      maxVolume: 10,
      minVolume: 1,
    },
  },
} as any

describe('getActiveNozzleAmount', () => {
  it('should return 8 for a 96ch with COLUMN tip pick up', () => {
    const args = {
      nozzles: COLUMN,
      pipetteSpec: MOCK_P96_SPECS,
      primaryNozzle: A1_NOZZLE,
    }
    expect(getActiveNozzleAmount(args)).toEqual(8)
  })
  it('should return 12 for a 96ch with ROW tip pick up', () => {
    const args = {
      nozzles: ROW,
      pipetteSpec: MOCK_P96_SPECS,
      primaryNozzle: A1_NOZZLE,
    }
    expect(getActiveNozzleAmount(args)).toEqual(12)
  })
  it('should return 1 for a 96ch with SINGLE tip pick up', () => {
    const args = {
      nozzles: SINGLE,
      pipetteSpec: MOCK_P96_SPECS,
      primaryNozzle: A1_NOZZLE,
    }
    expect(getActiveNozzleAmount(args)).toEqual(1)
  })
  it('should return 1 for a 8ch with SINGLE tip pick up', () => {
    const args = {
      nozzles: SINGLE,
      pipetteSpec: MOCK_P8_SPECS,
      primaryNozzle: A1_NOZZLE,
    }
    expect(getActiveNozzleAmount(args)).toEqual(1)
  })
  it('should return 3 for a 8ch with PARTIAL tip pick up using nozzle F1', () => {
    const args = {
      nozzles: PARTIAL_COLUMN,
      pipetteSpec: MOCK_P8_SPECS,
      primaryNozzle: F1_NOZZLE,
    }
    expect(getActiveNozzleAmount(args)).toEqual(3)
  })
  it('should return 4 for a 8ch QUADRANT config with backLeftNozzle E1', () => {
    const args = {
      nozzles: QUADRANT,
      pipetteSpec: MOCK_P8_SPECS,
      primaryNozzle: A1_NOZZLE,
      backLeftNozzle: E1_NOZZLE,
    }
    expect(getActiveNozzleAmount(args)).toEqual(4)
  })
  it('should return the pipette channels if ALL tip pick up', () => {
    const args8ch = {
      nozzles: ALL,
      pipetteSpec: MOCK_P8_SPECS,
      primaryNozzle: A1_NOZZLE,
    }
    expect(getActiveNozzleAmount(args8ch)).toEqual(8)
    const args96ch = {
      nozzles: ALL,
      pipetteSpec: MOCK_P96_SPECS,
      primaryNozzle: A1_NOZZLE,
    }
    expect(getActiveNozzleAmount(args96ch)).toEqual(96)
    const args1ch = {
      nozzles: ALL,
      pipetteSpec: MOCK_P1_SPECS,
      primaryNozzle: A1_NOZZLE,
    }
    expect(getActiveNozzleAmount(args1ch)).toEqual(1)
  })
})
