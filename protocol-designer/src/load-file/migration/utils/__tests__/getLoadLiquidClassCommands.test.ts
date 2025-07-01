import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getAllLiquidClassDefs } from '@opentrons/shared-data'

import { getLoadLiquidClassCommands } from '../getLoadLiquidClassCommands'

import type { LiquidClass } from '@opentrons/shared-data'
import type { PipetteEntities } from '@opentrons/step-generation'
import type { SavedStepFormState } from '/protocol-designer/step-forms/reducers'

vi.mock('@opentrons/shared-data', async () => {
  const actual = await vi.importActual('@opentrons/shared-data')
  return {
    ...actual,
    getAllLiquidClassDefs: vi.fn(),
  }
})

const MOCK_PIPETTE_ENTITIES = ({
  mockPipette1: {
    spec: {
      channels: 1,
      liquids: { default: { maxVolume: 1000 } },
    },
  },
} as unknown) as PipetteEntities

const MOCK_SAVED_STEP_FORMS = ({
  step0: {
    pipette: 'mockPipette1',
    liquidClass: 'mockLiquidClass1',
    tipRack: 'mockTipRack1',
    stepType: 'moveLiquid',
    id: 'step0',
  },
  step1: {
    pipette: 'mockPipette1',
    liquidClass: 'mockLiquidClass2',
    tipRack: 'mockTipRack3',
    stepType: 'mix',
    id: 'step1',
  },
} as unknown) as SavedStepFormState

const mockLiquidClasses = {
  mockLiquidClass1: {
    byPipette: [
      {
        pipetteModel: 'flex_1channel_1000',
        byTipType: [
          {
            tiprack: 'mockTipRack1',
          },
          {
            tiprack: 'mockTipRack2',
          },
        ],
      },
    ],
  },
  mockLiquidClass2: {
    byPipette: [
      {
        pipetteModel: 'flex_1channel_1000',
        byTipType: [
          {
            tiprack: 'mockTipRack3',
          },
          {
            tiprack: 'mockTipRack4',
          },
        ],
      },
    ],
  },
}

describe('getLoadLiquidClassCommands', () => {
  beforeEach(() => {
    vi.mocked(getAllLiquidClassDefs).mockReturnValue(
      (mockLiquidClasses as unknown) as Record<string, LiquidClass>
    )
  })

  it('returns load commands for each liquid class in the step forms', () => {
    const result = getLoadLiquidClassCommands(
      MOCK_PIPETTE_ENTITIES,
      MOCK_SAVED_STEP_FORMS
    )
    expect(result).toEqual([
      {
        key: expect.any(String),
        commandType: 'loadLiquidClass' as const,
        params: {
          liquidClassRecord: {
            tiprack: 'mockTipRack1',
            liquidClassName: 'mockLiquidClass1',
            pipetteModel: 'flex_1channel_1000',
          },
        },
      },
      {
        key: expect.any(String),
        commandType: 'loadLiquidClass' as const,
        params: {
          liquidClassRecord: {
            tiprack: 'mockTipRack3',
            liquidClassName: 'mockLiquidClass2',
            pipetteModel: 'flex_1channel_1000',
          },
        },
      },
    ])
  })

  it('returns load commands for only unique liquid classes in the step forms', () => {
    const result = getLoadLiquidClassCommands(MOCK_PIPETTE_ENTITIES, {
      ...MOCK_SAVED_STEP_FORMS,
      step2: {
        stepType: 'moveLiquid',
        id: 'step2',
        pipette: 'mockPipette1',
        liquidClass: 'mockLiquidClass2',
        tipRack: 'mockTipRack3',
      },
    })
    expect(result).toEqual([
      {
        key: expect.any(String),
        commandType: 'loadLiquidClass' as const,
        params: {
          liquidClassRecord: {
            tiprack: 'mockTipRack1',
            liquidClassName: 'mockLiquidClass1',
            pipetteModel: 'flex_1channel_1000',
          },
        },
      },
      {
        key: expect.any(String),
        commandType: 'loadLiquidClass' as const,
        params: {
          liquidClassRecord: {
            tiprack: 'mockTipRack3',
            liquidClassName: 'mockLiquidClass2',
            pipetteModel: 'flex_1channel_1000',
          },
        },
      },
    ])
  })

  it('returns does not load liquid classes if the liquid class does not contain a pipette match', () => {
    const result = getLoadLiquidClassCommands(MOCK_PIPETTE_ENTITIES, {
      ...MOCK_SAVED_STEP_FORMS,
      step1: {
        ...MOCK_SAVED_STEP_FORMS.step1,
        pipette: 'badPipette',
      },
    })
    expect(result).toEqual([
      {
        key: expect.any(String),
        commandType: 'loadLiquidClass' as const,
        params: {
          liquidClassRecord: {
            tiprack: 'mockTipRack1',
            liquidClassName: 'mockLiquidClass1',
            pipetteModel: 'flex_1channel_1000',
          },
        },
      },
    ])
  })

  it('returns does not load liquid classes if the liquid class does not contain a tiprack match', () => {
    const result = getLoadLiquidClassCommands(MOCK_PIPETTE_ENTITIES, {
      ...MOCK_SAVED_STEP_FORMS,
      step1: {
        ...MOCK_SAVED_STEP_FORMS.step1,
        tipRack: 'badTipRack',
      },
    })
    expect(result).toEqual([
      {
        key: expect.any(String),
        commandType: 'loadLiquidClass' as const,
        params: {
          liquidClassRecord: {
            tiprack: 'mockTipRack1',
            liquidClassName: 'mockLiquidClass1',
            pipetteModel: 'flex_1channel_1000',
          },
        },
      },
    ])
  })
})
