import { describe, it, vi, expect } from 'vitest'
import {
  HEATERSHAKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_BLOCK_V1,
  STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
  STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
} from '@opentrons/shared-data'
import { createModule } from '../../../../step-forms/actions'
import { deleteModule } from '../../../../modules'
import {
  createDeckFixture,
  deleteDeckFixture,
} from '../../../../step-forms/actions/additionalItems'
import { updateInitialDeckState } from '../util'
import type { AllTemporalPropertiesForTimelineFrame } from '../../../../step-forms'

vi.mock('../../../../step-forms/actions')
vi.mock('../../../../modules')
vi.mock('../../../../step-forms/actions/additionalItems')

const mockDispatch = vi.fn()
const mockEmptyIntialDeckSetup: AllTemporalPropertiesForTimelineFrame = {
  pipettes: {},
  labware: {},
  modules: {},
  additionalEquipmentOnDeck: {},
}

const mockInitialDeckSetup: AllTemporalPropertiesForTimelineFrame = {
  pipettes: {},
  labware: {},
  modules: {
    mod: {
      type: HEATERSHAKER_MODULE_TYPE,
      slot: 'D1',
      id: 'mod',
      model: HEATERSHAKER_MODULE_V1,
      pythonName: 'mockPythonName',
      moduleState: {} as any,
    },
    mag: {
      type: MAGNETIC_BLOCK_TYPE,
      slot: 'B3',
      id: 'mag',
      model: MAGNETIC_BLOCK_V1,
      pythonName: 'mockPythonName',
      moduleState: {} as any,
    },
  },
  additionalEquipmentOnDeck: {
    trash: { location: 'cutoutA3', name: 'trashBin', id: 'trash' },
    staging: { location: 'cutoutB3', name: 'stagingArea', id: 'staging' },
    staging2: { location: 'cutoutD3', name: 'stagingArea', id: 'staging2' },
    waste: { location: 'cutoutD3', name: 'wasteChute', id: 'waste' },
  },
}

describe('updateInitialDeckState', () => {
  it('creates a module', () => {
    updateInitialDeckState(
      [
        {
          cutoutId: 'cutoutD1',
          cutoutFixtureId: HEATERSHAKER_MODULE_V1,
          type: HEATERSHAKER_MODULE_V1,
        },
      ],
      mockEmptyIntialDeckSetup,
      mockDispatch
    )
    expect(mockDispatch).toHaveBeenCalledWith(
      vi.mocked(
        createModule({
          slot: 'A1',
          model: HEATERSHAKER_MODULE_V1,
          type: HEATERSHAKER_MODULE_TYPE,
        })
      )
    )
  })
  it('deletes a module', () => {
    updateInitialDeckState(
      [
        {
          cutoutId: 'cutoutD1',
          cutoutFixtureId: HEATERSHAKER_MODULE_V1,
          type: HEATERSHAKER_MODULE_V1,
        },
      ],
      mockInitialDeckSetup,
      mockDispatch
    )
    expect(mockDispatch).toHaveBeenCalledWith(
      vi.mocked(
        deleteModule({
          moduleId: 'mod',
        })
      )
    )
  })
  it('creates deck fixture', () => {
    updateInitialDeckState(
      [
        {
          cutoutId: 'cutoutA3',
          cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
          type: 'trashBin',
        },
      ],
      mockEmptyIntialDeckSetup,
      mockDispatch
    )
    expect(mockDispatch).toHaveBeenCalledWith(
      vi.mocked(createDeckFixture('trashBin', 'cutoutA3'))
    )
  })
  it('deletes deck fixture', () => {
    updateInitialDeckState(
      [
        {
          cutoutId: 'cutoutA3',
          cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
          type: 'trashBin',
        },
      ],
      mockInitialDeckSetup,
      mockDispatch
    )
    expect(mockDispatch).toHaveBeenCalledWith(
      vi.mocked(deleteDeckFixture('trash'))
    )
  })
  it('creates staging area and magnetic block', () => {
    updateInitialDeckState(
      [
        {
          cutoutId: 'cutoutB3',
          cutoutFixtureId: STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
          type: 'stagingAreaAndMagneticBlock',
        },
      ],
      mockEmptyIntialDeckSetup,
      mockDispatch
    )
    expect(mockDispatch).toHaveBeenNthCalledWith(
      1,
      createDeckFixture('stagingArea', 'cutoutB3')
    )
    expect(mockDispatch).toHaveBeenNthCalledWith(
      2,
      createModule({
        slot: 'B1',
        model: MAGNETIC_BLOCK_V1,
        type: MAGNETIC_BLOCK_TYPE,
      })
    )
  })
  it('deletes staging area and magnetic block', () => {
    updateInitialDeckState(
      [
        {
          cutoutId: 'cutoutB3',
          cutoutFixtureId: STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
          type: 'stagingAreaAndMagneticBlock',
        },
      ],
      mockInitialDeckSetup,
      mockDispatch
    )
    expect(mockDispatch).toHaveBeenNthCalledWith(
      1,
      vi.mocked(deleteDeckFixture('staging'))
    )
    expect(mockDispatch).toHaveBeenCalledWith(
      vi.mocked(
        deleteModule({
          moduleId: 'mag',
        })
      )
    )
  })
  it('creates staging area and waste chute', () => {
    updateInitialDeckState(
      [
        {
          cutoutId: 'cutoutD3',
          cutoutFixtureId: STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
          type: 'stagingAreaAndWasteChute',
        },
      ],
      mockEmptyIntialDeckSetup,
      mockDispatch
    )
    expect(mockDispatch).toHaveBeenNthCalledWith(
      1,
      createDeckFixture('stagingArea', 'cutoutD3')
    )
    expect(mockDispatch).toHaveBeenNthCalledWith(
      2,
      createDeckFixture('wasteChute', 'cutoutD3')
    )
  })
  it('deletes staging area and waste chute', () => {
    updateInitialDeckState(
      [
        {
          cutoutId: 'cutoutD3',
          cutoutFixtureId: STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
          type: 'stagingAreaAndWasteChute',
        },
      ],
      mockInitialDeckSetup,
      mockDispatch
    )
    expect(mockDispatch).toHaveBeenNthCalledWith(
      1,
      vi.mocked(deleteDeckFixture('staging2'))
    )
    expect(mockDispatch).toHaveBeenCalledWith(
      vi.mocked(deleteDeckFixture('waste'))
    )
  })
})
