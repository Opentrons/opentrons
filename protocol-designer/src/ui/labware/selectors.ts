import { createSelector } from 'reselect'
import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'
import { getIsTiprack, getLabwareDisplayName } from '@opentrons/shared-data'
import { i18n } from '../../localization'
import * as stepFormSelectors from '../../step-forms/selectors'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import { getModuleUnderLabware } from '../modules/utils'
import { Options } from '@opentrons/components'
import {
  AdditionalEquipmentEntity,
  LabwareEntity,
} from '@opentrons/step-generation'
import { Selector } from '../../types'
import { getTrashBinEntity } from '../../components/labware'
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
    // sort by name everything else by name
    return a.name.localeCompare(b.name)
  })

/** Returns options for labware dropdowns, excluding tiprack labware.
 * Ordered by display name / nickname, but with trash bin at the bottom.
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
    const trashBin = getTrashBinEntity(additionalEquipmentEntities)
    const options = reduce(
      labwareEntities,
      (
        acc: Options,
        labwareEntity: LabwareEntity,
        labwareId: string
      ): Options => {
        const isAdapter = labwareEntity.def.allowedRoles?.includes('adapter')
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
        const nickName =
          module != null
            ? `${nicknamesById[labwareId]} in ${module}`
            : nicknamesById[labwareId]

        if (!moveLabwarePresavedStep) {
          return getIsTiprack(labwareEntity.def) || isAdapter
            ? acc
            : [
                ...acc,
                {
                  name: nickName,
                  value: labwareId,
                },
              ]
        } else {
          return isAdapterOrAluminumBlock
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

    const allOptions: Options =
      trashBin != null && !moveLabwarePresavedStep
        ? [...options, { name: 'Trash bin', value: trashBin.id }]
        : options

    return _sortLabwareDropdownOptions(allOptions)
  }
)

/** Returns options for disposal (e.g. trash and trash box) */
export const getDisposalLabwareOptions: Selector<Options> = createSelector(
  stepFormSelectors.getAdditionalEquipmentEntities,
  additionalEquipmentEntities =>
    reduce(
      additionalEquipmentEntities,
      (
        acc: Options,
        additionalEquipment: AdditionalEquipmentEntity,
        additionalEquipmentId
      ): Options =>
        additionalEquipment.name === 'trashBin'
          ? [
              ...acc,
              {
                name: 'trashBin',
                value: additionalEquipmentId,
              },
            ]
          : acc,
      []
    )
)
