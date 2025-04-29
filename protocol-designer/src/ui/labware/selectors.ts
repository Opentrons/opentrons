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
import { getDeckSetupForActiveItem } from '../../top-selectors/labware-locations/index'

import type { DropdownOption } from '@opentrons/components'
import type {
  AdditionalEquipmentEntity,
  LabwareEntity,
} from '@opentrons/step-generation'
import type { AllTemporalPropertiesForTimelineFrame } from '../../step-forms'
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

const getNickname = (
  nicknamesById: Record<string, string>,
  activeDeckSetup: AllTemporalPropertiesForTimelineFrame,
  labwareId: string
): string => {
  const latestSlot = activeDeckSetup.labware[labwareId].slot

  let nickName: string = nicknamesById[labwareId]
  if (latestSlot != null && latestSlot !== 'offDeck') {
    nickName = `${nicknamesById[labwareId]} in ${latestSlot}`
  } else if (latestSlot != null && latestSlot === 'offDeck') {
    nickName = `${nicknamesById[labwareId]} off-deck`
  }
  return nickName
}

/** Returns options for labware dropdowns for moveLabware.
 * Ordered by display name / nickname, but with trash at the bottom.
 */
export const getMoveLabwareOptions: Selector<DropdownOption[]> = createSelector(
  stepFormSelectors.getLabwareEntities,
  getLabwareNicknamesById,
  getDeckSetupForActiveItem,
  stepFormSelectors.getSavedStepForms,
  stepFormSelectors.getAdditionalEquipmentEntities,
  stepFormSelectors.getUnsavedForm,
  (
    labwareEntities,
    nicknamesById,
    activeDeckSetup,
    savedStepForms,
    additionalEquipmentEntities,
    unsavedForm
  ) => {
    const savedFormKeys = Object.keys(savedStepForms)
    const previouslySavedFormDataIndex = unsavedForm
      ? savedFormKeys.indexOf(unsavedForm.id)
      : -1
    const filteredSavedStepFormIds =
      previouslySavedFormDataIndex !== -1
        ? savedFormKeys.slice(0, previouslySavedFormDataIndex)
        : savedFormKeys

    const wasteChuteLocation = Object.values(additionalEquipmentEntities).find(
      aE => aE.name === 'wasteChute'
    )?.location

    const moveLabwareOptions = reduce(
      labwareEntities,
      (
        acc: DropdownOption[],
        labwareEntity: LabwareEntity,
        labwareId: string
      ): DropdownOption[] => {
        const isLabwareInWasteChute =
          filteredSavedStepFormIds.find(
            id =>
              savedStepForms[id].stepType === 'moveLabware' &&
              savedStepForms[id].labware === labwareId &&
              savedStepForms[id].newLocation === wasteChuteLocation
          ) != null

        const isAdapter =
          labwareEntity.def.allowedRoles?.includes('adapter') ?? false
        const nickName = getNickname(nicknamesById, activeDeckSetup, labwareId)

        //  filter out moving trash, adapters, and labware in
        //  waste chute for moveLabware
        return isAdapter || isLabwareInWasteChute
          ? acc
          : [
              ...acc,
              {
                name: nickName,
                value: labwareId,
              },
            ]
      },
      []
    )
    return _sortLabwareDropdownOptions(moveLabwareOptions)
  }
)

/** Returns options for labware dropdowns for moveLiquids.
 * Ordered by display name / nickname, but with trash at the bottom.
 */
export const getLabwareOptions: Selector<DropdownOption[]> = createSelector(
  stepFormSelectors.getLabwareEntities,
  getLabwareNicknamesById,
  getDeckSetupForActiveItem,
  stepFormSelectors.getSavedStepForms,
  stepFormSelectors.getAdditionalEquipmentEntities,
  stepFormSelectors.getUnsavedForm,
  (
    labwareEntities,
    nicknamesById,
    activeDeckSetup,
    savedStepForms,
    additionalEquipmentEntities,
    unsavedForm
  ) => {
    const savedFormKeys = Object.keys(savedStepForms)
    const previouslySavedFormDataIndex = unsavedForm
      ? savedFormKeys.indexOf(unsavedForm.id)
      : -1
    const filteredSavedStepFormIds =
      previouslySavedFormDataIndex !== -1
        ? savedFormKeys.slice(0, previouslySavedFormDataIndex)
        : savedFormKeys

    const wasteChuteLocation = Object.values(additionalEquipmentEntities).find(
      aE => aE.name === 'wasteChute'
    )?.location

    const labwareOptions = reduce(
      labwareEntities,
      (
        acc: DropdownOption[],
        labwareEntity: LabwareEntity,
        labwareId: string
      ): DropdownOption[] => {
        const isLabwareInWasteChute =
          filteredSavedStepFormIds.find(
            id =>
              savedStepForms[id].stepType === 'moveLabware' &&
              savedStepForms[id].labware === labwareId &&
              savedStepForms[id].newLocation === wasteChuteLocation
          ) != null

        const isAdapter =
          labwareEntity.def.allowedRoles?.includes('adapter') ?? false
        const nickName = getNickname(nicknamesById, activeDeckSetup, labwareId)

        return getIsTiprack(labwareEntity.def) ||
          isAdapter ||
          isLabwareInWasteChute
          ? acc
          : [
              ...acc,
              {
                name: nickName,
                value: labwareId,
              },
            ]
      },
      []
    )
    return _sortLabwareDropdownOptions(labwareOptions)
  }
)

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
