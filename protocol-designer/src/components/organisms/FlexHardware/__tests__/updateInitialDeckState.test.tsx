import { describe, expect, it, vi } from 'vitest'

import {
  fixture12Trough,
  HEATERSHAKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_BLOCK_V1,
  STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
  STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
} from '@opentrons/shared-data'

import { deleteModule } from '../../../../modules'
import { createModule } from '../../../../step-forms/actions'
import {
  createDeckFixture,
  deleteDeckFixture,
} from '../../../../step-forms/actions/additionalItems'
import { updateInitialDeckState } from '../util'

import type {
  DeckConfiguration,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import type {
  AllTemporalPropertiesForTimelineFrame,
  SavedStepFormState,
} from '../../../../step-forms'

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
const mockSetShowDeleteEntityModal = vi.fn()
const mockSetShowDeleteStagingAreaModal = vi.fn()
const mockSavedSteps: SavedStepFormState = {}
const mockSavedStepsWithHSStep: SavedStepFormState = {
  step: { id: 'step', stepType: 'heaterShaker', moduleId: 'mod' },
  step2: { id: 'step2', stepType: 'moveLabware', newLocation: 'waste' },
}
const mockMakeSnackbar = vi.fn()
const mockT = (key: string) => key
const mockDeckConfig: DeckConfiguration = []

describe('updateInitialDeckState', () => {
  it('creates a module', () => {
    updateInitialDeckState({
      values: [
        {
          cutoutId: 'cutoutD1',
          cutoutFixtureId: HEATERSHAKER_MODULE_V1,
          type: HEATERSHAKER_MODULE_V1,
        },
      ],
      initialDeckSetup: mockEmptyIntialDeckSetup,
      dispatch: mockDispatch,
      setShowDeleteEntityModal: mockSetShowDeleteEntityModal,
      setShowDeleteStagingAreaModal: mockSetShowDeleteStagingAreaModal,
      savedSteps: mockSavedSteps,
      makeSnackbar: mockMakeSnackbar,
      t: mockT,
    })
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
  it('creates calls the snackbar when trying to create a module with an incompatible labware in the slot', () => {
    updateInitialDeckState({
      values: [
        {
          cutoutId: 'cutoutD1',
          cutoutFixtureId: HEATERSHAKER_MODULE_V1,
          type: HEATERSHAKER_MODULE_V1,
        },
      ],
      initialDeckSetup: {
        pipettes: {},
        labware: {
          labware: {
            stack: ['labware', 'D1'],
            def: fixture12Trough as LabwareDefinition2,
            labwareDefURI: 'mockURI',
            id: 'labware',
            pythonName: 'mockPythonName',
          },
        },
        modules: {},
        additionalEquipmentOnDeck: {},
      },
      dispatch: mockDispatch,
      setShowDeleteEntityModal: mockSetShowDeleteEntityModal,
      setShowDeleteStagingAreaModal: mockSetShowDeleteStagingAreaModal,
      savedSteps: mockSavedSteps,
      makeSnackbar: mockMakeSnackbar,
      t: mockT,
    })
    expect(mockMakeSnackbar).toHaveBeenCalledWith('module_incompatible')
  })
  it('deletes a module', () => {
    updateInitialDeckState({
      values: [
        {
          cutoutId: 'cutoutD1',
          cutoutFixtureId: HEATERSHAKER_MODULE_V1,
          type: HEATERSHAKER_MODULE_V1,
        },
      ],
      initialDeckSetup: mockInitialDeckSetup,
      dispatch: mockDispatch,
      setShowDeleteEntityModal: mockSetShowDeleteEntityModal,
      setShowDeleteStagingAreaModal: mockSetShowDeleteStagingAreaModal,
      savedSteps: mockSavedSteps,
      makeSnackbar: mockMakeSnackbar,
      t: mockT,
    })
    expect(mockDispatch).toHaveBeenCalledWith(
      vi.mocked(
        deleteModule({
          moduleId: 'mod',
        })
      )
    )
  })
  it('deletes a module that is in use', () => {
    updateInitialDeckState({
      values: [
        {
          cutoutId: 'cutoutD1',
          cutoutFixtureId: HEATERSHAKER_MODULE_V1,
          type: HEATERSHAKER_MODULE_V1,
        },
      ],
      initialDeckSetup: mockInitialDeckSetup,
      dispatch: mockDispatch,
      setShowDeleteEntityModal: mockSetShowDeleteEntityModal,
      setShowDeleteStagingAreaModal: mockSetShowDeleteStagingAreaModal,
      savedSteps: mockSavedStepsWithHSStep,
      makeSnackbar: mockMakeSnackbar,
      t: mockT,
      deckConfig: mockDeckConfig,
    })
    expect(mockSetShowDeleteEntityModal).toHaveBeenCalled()
  })
  it('creates deck fixture', () => {
    updateInitialDeckState({
      values: [
        {
          cutoutId: 'cutoutA3',
          cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
          type: 'trashBin',
        },
      ],
      initialDeckSetup: mockEmptyIntialDeckSetup,
      dispatch: mockDispatch,
      setShowDeleteEntityModal: mockSetShowDeleteEntityModal,
      setShowDeleteStagingAreaModal: mockSetShowDeleteStagingAreaModal,
      savedSteps: mockSavedSteps,
      makeSnackbar: mockMakeSnackbar,
      t: mockT,
    })
    expect(mockDispatch).toHaveBeenCalledWith(
      vi.mocked(createDeckFixture('trashBin', 'cutoutA3'))
    )
  })
  it('renders snackbar when there is a labware on the slot', () => {
    updateInitialDeckState({
      values: [
        {
          cutoutId: 'cutoutA3',
          cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
          type: 'trashBin',
        },
      ],
      initialDeckSetup: {
        ...mockEmptyIntialDeckSetup,
        labware: {
          labware: {
            stack: ['labware', 'A3'],
            def: fixture12Trough as LabwareDefinition2,
            labwareDefURI: 'mockURI',
            id: 'labware',
            pythonName: 'mockPythonName',
          },
        },
      },
      dispatch: mockDispatch,
      setShowDeleteEntityModal: mockSetShowDeleteEntityModal,
      setShowDeleteStagingAreaModal: mockSetShowDeleteStagingAreaModal,
      savedSteps: mockSavedSteps,
      makeSnackbar: mockMakeSnackbar,
      t: mockT,
    })
    expect(mockMakeSnackbar).toHaveBeenCalledWith(
      'conflict_on_slot_labware_fixture'
    )
  })
  it('deletes deck fixture', () => {
    updateInitialDeckState({
      values: [
        {
          cutoutId: 'cutoutA3',
          cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
          type: 'trashBin',
        },
      ],
      initialDeckSetup: mockInitialDeckSetup,
      dispatch: mockDispatch,
      setShowDeleteEntityModal: mockSetShowDeleteEntityModal,
      setShowDeleteStagingAreaModal: mockSetShowDeleteStagingAreaModal,
      savedSteps: mockSavedSteps,
      makeSnackbar: mockMakeSnackbar,
      t: mockT,
    })
    expect(mockDispatch).toHaveBeenCalledWith(
      vi.mocked(deleteDeckFixture('trash'))
    )
  })
  it('creates staging area and magnetic block', () => {
    updateInitialDeckState({
      values: [
        {
          cutoutId: 'cutoutB3',
          cutoutFixtureId: STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
          type: 'stagingAreaAndMagneticBlock',
        },
      ],
      initialDeckSetup: mockEmptyIntialDeckSetup,
      dispatch: mockDispatch,
      setShowDeleteEntityModal: mockSetShowDeleteEntityModal,
      setShowDeleteStagingAreaModal: mockSetShowDeleteStagingAreaModal,
      savedSteps: mockSavedSteps,
      makeSnackbar: mockMakeSnackbar,
      t: mockT,
    })
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
    updateInitialDeckState({
      values: [
        {
          cutoutId: 'cutoutB3',
          cutoutFixtureId: STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
          type: 'stagingAreaAndMagneticBlock',
        },
      ],
      initialDeckSetup: mockInitialDeckSetup,
      dispatch: mockDispatch,
      setShowDeleteEntityModal: mockSetShowDeleteEntityModal,
      setShowDeleteStagingAreaModal: mockSetShowDeleteStagingAreaModal,
      savedSteps: mockSavedSteps,
      makeSnackbar: mockMakeSnackbar,
      t: mockT,
    })
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
  it('deletes staging area and magnetic block but there is a labware in the 4th column', () => {
    updateInitialDeckState({
      values: [
        {
          cutoutId: 'cutoutB3',
          cutoutFixtureId: STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
          type: 'stagingAreaAndMagneticBlock',
        },
      ],
      initialDeckSetup: {
        ...mockInitialDeckSetup,
        labware: {
          labware: {
            stack: ['labware', 'B4'],
            def: fixture12Trough as LabwareDefinition2,
            labwareDefURI: 'mockURI',
            id: 'labware',
            pythonName: 'mockPythonName',
          },
        },
      },
      dispatch: mockDispatch,
      setShowDeleteEntityModal: mockSetShowDeleteEntityModal,
      setShowDeleteStagingAreaModal: mockSetShowDeleteStagingAreaModal,
      savedSteps: mockSavedSteps,
      makeSnackbar: mockMakeSnackbar,
      t: mockT,
      deckConfig: mockDeckConfig,
    })
    expect(mockSetShowDeleteStagingAreaModal).toHaveBeenCalled()
  })
  it('creates staging area and waste chute', () => {
    updateInitialDeckState({
      values: [
        {
          cutoutId: 'cutoutD3',
          cutoutFixtureId: STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
          type: 'stagingAreaAndWasteChute',
        },
      ],
      initialDeckSetup: mockEmptyIntialDeckSetup,
      dispatch: mockDispatch,
      setShowDeleteEntityModal: mockSetShowDeleteEntityModal,
      setShowDeleteStagingAreaModal: mockSetShowDeleteStagingAreaModal,
      savedSteps: mockSavedSteps,
      makeSnackbar: mockMakeSnackbar,
      t: mockT,
    })
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
    updateInitialDeckState({
      values: [
        {
          cutoutId: 'cutoutD3',
          cutoutFixtureId: STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
          type: 'stagingAreaAndWasteChute',
        },
      ],
      initialDeckSetup: mockInitialDeckSetup,
      dispatch: mockDispatch,
      setShowDeleteEntityModal: mockSetShowDeleteEntityModal,
      setShowDeleteStagingAreaModal: mockSetShowDeleteStagingAreaModal,
      savedSteps: mockSavedSteps,
      makeSnackbar: mockMakeSnackbar,
      t: mockT,
    })
    expect(mockDispatch).toHaveBeenNthCalledWith(
      1,
      vi.mocked(deleteDeckFixture('staging2'))
    )
    expect(mockDispatch).toHaveBeenCalledWith(
      vi.mocked(deleteDeckFixture('waste'))
    )
  })
  it('tries to delete staging area and waste chute but there is labware in 4th column slot', () => {
    updateInitialDeckState({
      values: [
        {
          cutoutId: 'cutoutD3',
          cutoutFixtureId: STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
          type: 'stagingAreaAndWasteChute',
        },
      ],
      initialDeckSetup: {
        ...mockInitialDeckSetup,
        labware: {
          labware: {
            stack: ['labware', 'D4'],
            def: fixture12Trough as LabwareDefinition2,
            labwareDefURI: 'mockURI',
            id: 'labware',
            pythonName: 'mockPythonName',
          },
        },
      },
      dispatch: mockDispatch,
      setShowDeleteEntityModal: mockSetShowDeleteEntityModal,
      setShowDeleteStagingAreaModal: mockSetShowDeleteStagingAreaModal,
      savedSteps: mockSavedSteps,
      makeSnackbar: mockMakeSnackbar,
      t: mockT,
      deckConfig: mockDeckConfig,
    })
    expect(mockSetShowDeleteStagingAreaModal).toHaveBeenCalled()
  })
  it('tries to delete staging area and waste chute but something is in use', () => {
    updateInitialDeckState({
      values: [
        {
          cutoutId: 'cutoutD3',
          cutoutFixtureId: STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
          type: 'stagingAreaAndWasteChute',
        },
      ],

      initialDeckSetup: mockInitialDeckSetup,
      dispatch: mockDispatch,
      setShowDeleteEntityModal: mockSetShowDeleteEntityModal,
      setShowDeleteStagingAreaModal: mockSetShowDeleteStagingAreaModal,
      savedSteps: mockSavedStepsWithHSStep,
      makeSnackbar: mockMakeSnackbar,
      t: mockT,
      deckConfig: mockDeckConfig,
    })
    expect(mockSetShowDeleteEntityModal).toHaveBeenCalled()
  })
})
