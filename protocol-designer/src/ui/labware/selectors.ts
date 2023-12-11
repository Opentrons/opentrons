import { createSelector } from 'reselect'
import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'
import { getIsTiprack, getLabwareDisplayName } from '@opentrons/shared-data'
import { AdditionalEquipmentEntity } from '@opentrons/step-generation'
import { i18n } from '../../localization'
import * as stepFormSelectors from '../../step-forms/selectors'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import { getModuleUnderLabware } from '../modules/utils'
import { getLabwareOffDeck, getLabwareInColumn4 } from './utils'

import type { LabwareEntity } from '@opentrons/step-generation'
import type { DropdownOption, Options } from '@opentrons/components'
import type { Selector } from '../../types'

const TRASH = 'Trash Bin'

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
export const _sortLabwareDropdownOptions = (options: Options): Options =>
  options.sort((a, b) => {
    // special case for trash (always at the bottom of the list)
    if (a.name === TRASH) return 1
    if (b.name === TRASH) return -1
    // sort by name everything else by name
    return a.name.localeCompare(b.name)
  })

/** Returns options for labware dropdowns.
 * Ordered by display name / nickname, but with trash at the bottom.
 */
export const getLabwareOptions: Selector<Options> = createSelector(
  stepFormSelectors.getLabwareEntities,
  getLabwareNicknamesById,
  stepFormSelectors.getInitialDeckSetup,
  stepFormSelectors.getPresavedStepForm,
  stepFormSelectors.getSavedStepForms,
  stepFormSelectors.getAdditionalEquipmentEntities,
  (
    labwareEntities,
    nicknamesById,
    initialDeckSetup,
    presavedStepForm,
    savedStepForms,
    additionalEquipmentEntities
  ) => {
    const moveLabwarePresavedStep = presavedStepForm?.stepType === 'moveLabware'
    const wasteChuteLocation = Object.values(additionalEquipmentEntities).find(
      aE => aE.name === 'wasteChute'
    )?.location

    const labwareOptions = reduce(
      labwareEntities,
      (
        acc: Options,
        labwareEntity: LabwareEntity,
        labwareId: string
      ): Options => {
        const isLabwareInWasteChute = Object.values(savedStepForms).find(
          form =>
            form.stepType === 'moveLabware' &&
            form.labware === labwareId &&
            form.newLocation === wasteChuteLocation
        )

        const isAdapter = labwareEntity.def.allowedRoles?.includes('adapter')
        const isOffDeck = getLabwareOffDeck(
          initialDeckSetup,
          savedStepForms ?? {},
          labwareId
        )

        const isAdapterOrAluminumBlock =
          isAdapter ||
          labwareEntity.def.metadata.displayCategory === 'aluminumBlock'

        const moduleOnDeck = getModuleUnderLabware(
          initialDeckSetup,
          savedStepForms ?? {},
          labwareId
        )
        const module =
          moduleOnDeck != null
            ? i18n.t(
                `form.step_edit_form.field.moduleLabwarePrefix.${moduleOnDeck.type}`
              )
            : null

        const isLabwareInColumn4 = getLabwareInColumn4(
          initialDeckSetup,
          savedStepForms ?? {},
          labwareId
        )

        let nickName = nicknamesById[labwareId]
        if (module != null) {
          nickName = `${nicknamesById[labwareId]} in ${module}`
        } else if (isOffDeck) {
          nickName = `Off-deck - ${nicknamesById[labwareId]}`
        } else if (isLabwareInColumn4) {
          nickName = `${nicknamesById[labwareId]} in staging area slot`
        }

        if (!moveLabwarePresavedStep) {
          //  filter out tip racks, adapters, and labware in waste chute
          //  for aspirating/dispensing/mixing into
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
        } else {
          //  filter out moving trash, aluminum blocks, adapters and labware in
          //  waste chute for moveLabware
          return isAdapterOrAluminumBlock || isLabwareInWasteChute
            ? acc
            : [
                ...acc,
                {
                  name: nickName,
                  value: labwareId,
                },
              ]
        }
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
            name: 'Waste Chute',
            value: wasteChuteEntity.id,
          }
        : null

    return wasteChuteOption
  }
)

/** Returns options for disposal (e.g. trash) */
export const getDisposalOptions: Selector<Options> = createSelector(
  stepFormSelectors.getAdditionalEquipment,
  getWasteChuteOption,
  (additionalEquipment, wasteChuteOption) => {
    const trashBins = reduce(
      additionalEquipment,
      (acc: Options, additionalEquipment: AdditionalEquipmentEntity): Options =>
        additionalEquipment.name === 'trashBin'
          ? [
              ...acc,
              {
                name: TRASH,
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
