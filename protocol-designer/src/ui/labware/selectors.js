// @flow
import { createSelector } from 'reselect'
import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'

import { getIsTiprack } from '@opentrons/shared-data'
import { selectors as stepFormSelectors } from '../../step-forms'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import { labwareToDisplayName } from '../../labware-ingred/utils'
import { DISPOSAL_LABWARE_TYPES } from '../../constants'

import type { Options } from '@opentrons/components'
import type { Selector } from '../../types'
import type { LabwareEntity, NormalizedLabware } from '../../step-forms'

export const getLabwareNicknamesById: Selector<{
  [labwareId: string]: string,
}> = createSelector(
  stepFormSelectors.getLabwareEntities,
  labwareIngredSelectors.getLabwareNameInfo,
  (labwareEntities, displayLabware): { [labwareId: string]: string } =>
    mapValues(labwareEntities, (labwareEntity: LabwareEntity, id: string) =>
      labwareToDisplayName(displayLabware[id], labwareEntity.type)
    )
)

/** Returns options for dropdowns, excluding tiprack labware */
export const getLabwareOptions: Selector<Options> = createSelector(
  stepFormSelectors.getLabwareEntities,
  getLabwareNicknamesById,
  (labwareEntities, nicknamesById) =>
    reduce(
      labwareEntities,
      (acc: Options, l: LabwareEntity, labwareId: string): Options => {
        return getIsTiprack(l.def)
          ? acc
          : [
              ...acc,
              {
                name: nicknamesById[labwareId],
                value: labwareId,
              },
            ]
      },
      []
    )
)

/** Returns options for disposal (e.g. fixed trash and trash box) */
export const getDisposalLabwareOptions: Selector<Options> = createSelector(
  stepFormSelectors.getNormalizedLabwareById,
  getLabwareNicknamesById,
  (labwareById, names) =>
    reduce(
      labwareById,
      (acc: Options, labware: NormalizedLabware, labwareId): Options => {
        if (!labware.type || !DISPOSAL_LABWARE_TYPES.includes(labware.type)) {
          return acc
        }
        return [
          ...acc,
          {
            name: names[labwareId],
            value: labwareId,
          },
        ]
      },
      []
    )
)
