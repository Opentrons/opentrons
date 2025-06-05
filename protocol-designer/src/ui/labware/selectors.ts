import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'
import { createSelector } from 'reselect'

import {
  TRASH_BIN_DISPLAY_NAME,
  WASTE_CHUTE_DISPLAY_NAME,
} from '@opentrons/components'
import { getIsTiprack, getLabwareDisplayName } from '@opentrons/shared-data'

import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import * as stepFormSelectors from '../../step-forms/selectors'

import type { DropdownOption } from '@opentrons/components'
import type {
  AdditionalEquipmentEntity,
  LabwareEntity,
} from '@opentrons/step-generation'
import type { Selector } from '../../types'

export const getLabwareNicknamesById: Selector<
  Record<string, string>
> = createSelector(
  stepFormSelectors.getLabwareEntities,
  labwareIngredSelectors.getLabwareNameInfo,
  (labwareEntities, displayLabware): Record<string, string> =>
    mapValues(
      labwareEntities,
      (labwareEntity: LabwareEntity, id: string): string =>
        displayLabware[id]?.nickname || getLabwareDisplayName(labwareEntity.def)
    )
)
export const _sortLabwareDropdownOptions = (
  options: DropdownOption[]
): DropdownOption[] =>
  options.sort((a, b) => {
    return a.name.localeCompare(b.name)
  })

/** Returns waste chute option */
export const getWasteChuteOption: Selector<DropdownOption | null> = createSelector(
  stepFormSelectors.getAdditionalEquipmentEntities,
  additionalEquipmentEntities => {
    const wasteChuteEntity = Object.values(additionalEquipmentEntities).find(
      aE => aE.name === 'wasteChute'
    )
    const wasteChuteOption: DropdownOption | null =
      wasteChuteEntity != null
        ? {
            name: WASTE_CHUTE_DISPLAY_NAME,
            value: wasteChuteEntity.id,
          }
        : null

    return wasteChuteOption
  }
)

/** Returns options for disposal (e.g. trash) */
export const getDisposalOptions = createSelector(
  stepFormSelectors.getAdditionalEquipment,
  getWasteChuteOption,
  (additionalEquipment, wasteChuteOption) => {
    const trashBins = reduce(
      additionalEquipment,
      (
        acc: DropdownOption[],
        additionalEquipment: AdditionalEquipmentEntity
      ): DropdownOption[] =>
        additionalEquipment.name === 'trashBin'
          ? [
              ...acc,
              {
                name: TRASH_BIN_DISPLAY_NAME,
                value: additionalEquipment.id ?? '',
              },
            ]
          : acc,
      []
    )

    return wasteChuteOption != null
      ? ([...trashBins, wasteChuteOption] as DropdownOption[])
      : trashBins
  }
)

export const getTiprackOptions: Selector<DropdownOption[]> = createSelector(
  stepFormSelectors.getLabwareEntities,
  getLabwareNicknamesById,
  (labwareEntities, nicknamesById) => {
    const options = reduce(
      labwareEntities,
      (
        acc: DropdownOption[],
        labwareEntity: LabwareEntity,
        labwareId: string
      ): DropdownOption[] => {
        const labwareDefURI = labwareEntity.labwareDefURI
        const optionDefURI = acc.map(option => option.value)

        if (
          optionDefURI.includes(labwareDefURI) ||
          !getIsTiprack(labwareEntity.def)
        ) {
          return acc
        } else {
          return [
            ...acc,
            {
              name: nicknamesById[labwareId],
              value: labwareDefURI,
            },
          ]
        }
      },
      []
    )
    return options
  }
)

export const getAllTiprackOptions: Selector<DropdownOption[]> = createSelector(
  stepFormSelectors.getLabwareEntities,
  getLabwareNicknamesById,
  (labwareEntities, nicknamesById) => {
    const options = reduce(
      labwareEntities,
      (
        acc: DropdownOption[],
        labwareEntity: LabwareEntity,
        labwareId: string
      ): DropdownOption[] => {
        if (!getIsTiprack(labwareEntity.def)) {
          return acc
        } else {
          return [
            ...acc,
            {
              name: nicknamesById[labwareId],
              value: labwareEntity.id,
            },
          ]
        }
      },
      []
    )
    return options
  }
)
