// @flow
import { createSelector } from 'reselect'
import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'
import {
  getIsTiprack,
  getLabwareDisplayName,
  getLabwareHasQuirk,
} from '@opentrons/shared-data'
import * as stepFormSelectors from '../../step-forms/selectors'

import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'

import type { Options } from '@opentrons/components'
import type { Selector } from '../../types'
import type { LabwareEntity } from '../../step-forms'

export const getLabwareNicknamesById: Selector<{
  [labwareId: string]: string,
}> = createSelector(
  stepFormSelectors.getLabwareEntities,
  labwareIngredSelectors.getLabwareNameInfo,
  (labwareEntities, displayLabware): { [labwareId: string]: string } =>
    mapValues(
      labwareEntities,
      (labwareEntity: LabwareEntity, id: string): string =>
        displayLabware[id]?.nickname || getLabwareDisplayName(labwareEntity.def)
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
  stepFormSelectors.getLabwareEntities,
  getLabwareNicknamesById,
  (labwareEntities, names) =>
    reduce(
      labwareEntities,
      (acc: Options, labware: LabwareEntity, labwareId): Options =>
        getLabwareHasQuirk(labware.def, 'fixedTrash')
          ? [
              ...acc,
              {
                name: names[labwareId],
                value: labwareId,
              },
            ]
          : acc,
      []
    )
)
