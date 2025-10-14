import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ALL,
  getIsTiprack,
  getPositionFromSlotId,
} from '@opentrons/shared-data'
import { getSlotInLocationStack } from '@opentrons/step-generation'

import { getIsTiprackSelectable, getViewboxFromSelectedLabware } from '../utils'

import type { PipetteV2Specs } from '@opentrons/shared-data'
import type { LabwareOnDeck } from '/protocol-designer/step-forms'

vi.mock(import('@opentrons/step-generation'), async importOriginal => {
  const actual = await importOriginal()
  return {
    ...actual,
    getSlotInLocationStack: vi.fn(),
  }
})

vi.mock('@opentrons/shared-data')

const MOCK_TIPRACK_URI = 'mockTiprackUri'
const MOCK_NON_TIPRACK_URI = 'mockNonTiprackUri'
const BAD_LABWARE_URI = 'badLabwareUri'
const MOCK_DECK_DEF = {
  dimensions: [2, 1],
} as any
const activeDeckSetup = {
  labware: {
    [MOCK_TIPRACK_URI]: {
      def: { dimensions: { xDimension: 100, yDimension: 100 } },
    },
  },
} as any

const labware = {
  labwareDefURI: MOCK_TIPRACK_URI,
} as LabwareOnDeck

describe('getIsTiprackSelectable', () => {
  beforeEach(() => {
    vi.mocked(getSlotInLocationStack).mockReturnValue('A1')
    vi.mocked(getIsTiprack).mockReturnValue(true)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns true when the labware is a matching tiprack and in a pipettable slot', () => {
    expect(
      getIsTiprackSelectable({
        labware,
        formTiprackUri: MOCK_TIPRACK_URI,
        pipetteSpecs: { channels: 1 } as PipetteV2Specs,
        nozzles: ALL,
        labwareEntities: {},
      })
    ).toBe(true)
  })

  it('returns false when the labware is not a matching tiprack', () => {
    expect(
      getIsTiprackSelectable({
        labware,
        formTiprackUri: MOCK_NON_TIPRACK_URI,
        pipetteSpecs: { channels: 1 } as PipetteV2Specs,
        nozzles: ALL,
        labwareEntities: {},
      })
    ).toBe(false)
  })

  it('returns false when the labware is matching but in a non-pipettable slot', () => {
    vi.mocked(getSlotInLocationStack).mockReturnValue('A4')
    expect(
      getIsTiprackSelectable({
        labware,
        formTiprackUri: MOCK_TIPRACK_URI,
        pipetteSpecs: { channels: 1 } as PipetteV2Specs,
        nozzles: ALL,
        labwareEntities: {},
      })
    ).toBe(false)
  })

  it('returns false when the labware not a tiprack', () => {
    vi.mocked(getIsTiprack).mockReturnValue(false)
    expect(
      getIsTiprackSelectable({
        labware,
        formTiprackUri: MOCK_TIPRACK_URI,
        pipetteSpecs: { channels: 1 } as PipetteV2Specs,
        nozzles: ALL,
        labwareEntities: {},
      })
    ).toBe(false)
  })
})

describe('getViewboxFromSelectedLabware', () => {
  beforeEach(() => {
    vi.mocked(getSlotInLocationStack).mockReturnValue('A1')
    vi.mocked(getPositionFromSlotId).mockReturnValue([150, 150, 0])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns correct viewbox when dimensions are provided', () => {
    expect(
      getViewboxFromSelectedLabware(
        MOCK_TIPRACK_URI,
        activeDeckSetup,
        MOCK_DECK_DEF
      )
    ).toBe('100 125 200 150')
  })

  it('returns null if no labware is found', () => {
    expect(
      getViewboxFromSelectedLabware(
        BAD_LABWARE_URI,
        activeDeckSetup,
        MOCK_DECK_DEF
      )
    ).toBe(null)
  })

  it('returns null if no slot position is found', () => {
    vi.mocked(getPositionFromSlotId).mockReturnValue(null)
    expect(
      getViewboxFromSelectedLabware(
        MOCK_TIPRACK_URI,
        activeDeckSetup,
        MOCK_DECK_DEF
      )
    ).toBe(null)
  })
})
