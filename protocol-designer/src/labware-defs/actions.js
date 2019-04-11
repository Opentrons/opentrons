// @flow
import type { LabwareDefinition2 } from '@opentrons/shared-data'

export type CreateCustomLabwareDef = {
  type: 'CREATE_CUSTOM_LABWARE_DEF',
  payload: {
    def: LabwareDefinition2,
  },
}

export const createCustomLabwareDef = (
  payload: $PropertyType<CreateCustomLabwareDef, 'payload'>
): CreateCustomLabwareDef => ({
  type: 'CREATE_CUSTOM_LABWARE_DEF',
  payload,
})
