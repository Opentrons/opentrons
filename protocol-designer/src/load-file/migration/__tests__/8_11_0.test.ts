import { describe, expect, it } from 'vitest'

import { MAGNETIC_MODULE_V2 } from '@opentrons/shared-data'

import { INITIAL_DECK_SETUP_STEP_ID } from '../../../constants'
import { migrateFile } from '../8_11_0'

import type { ProtocolFile } from '@opentrons/shared-data'
import type { PDMetadata } from '/protocol-designer/file-types'
import type { FormData } from '/protocol-designer/form-types'

type LegacyFormData = FormData

describe('v8.11.0 migration', () => {
  it('sets labwareStackedOnNodeUpdate from labware stacks (slot and on-module)', () => {
    const moduleId = 'magnetic-module-id'
    const plateOnSlotId = 'plate-slot-id'
    const plateOnModuleId = 'plate-module-id'

    const initialDeckSetupStep: LegacyFormData = {
      labwareLocationUpdate: {
        [plateOnSlotId]: 'A1',
        [plateOnModuleId]: moduleId,
      },
      moduleLocationUpdate: {
        D1: moduleId,
      },
      pipetteLocationUpdate: {},
      trashBinLocationUpdate: {},
      wasteChuteLocationUpdate: {},
      stagingAreaLocationUpdate: {},
      gripperLocationUpdate: {},
      stepType: 'manualIntervention',
      id: INITIAL_DECK_SETUP_STEP_ID,
    }

    const input = createFile({
      version: '8.10.0',
      orderedStepIds: [],
      savedStepForms: {
        [INITIAL_DECK_SETUP_STEP_ID]: initialDeckSetupStep,
      },
      labware: {
        [plateOnSlotId]: {
          displayName: 'plate',
          labwareDefURI: 'fixture/fixture/1',
        },
        [plateOnModuleId]: {
          displayName: 'plate on mod',
          labwareDefURI: 'fixture/fixture/1',
        },
      },
      modules: {
        [moduleId]: { model: MAGNETIC_MODULE_V2 },
      },
    })

    const result = migrateFile(input)

    const deckForm =
      result.designerApplication?.data?.savedStepForms[
        INITIAL_DECK_SETUP_STEP_ID
      ]
    expect(deckForm?.labwareStackedOnNodeUpdate).toEqual({
      [plateOnSlotId]: { slotName: 'A1' },
      [plateOnModuleId]: { moduleId },
    })
  })
})

function createFile({
  orderedStepIds,
  savedStepForms,
  version,
  labware,
  modules,
}: {
  orderedStepIds: PDMetadata['orderedStepIds']
  savedStepForms: PDMetadata['savedStepForms']
  version: NonNullable<ProtocolFile['designerApplication']>['version']
  labware: PDMetadata['labware']
  modules: PDMetadata['modules']
}): ProtocolFile<PDMetadata> {
  return {
    designerApplication: {
      data: {
        orderedStepIds,
        savedStepForms,
        labware,
        modules,
        pipettes: {},
        pipetteTiprackAssignments: {},
        dismissedWarnings: {},
        ingredients: {},
        ingredLocations: {},
      },
      ...(version != null && { version }),
    },
  } as ProtocolFile<PDMetadata>
}
