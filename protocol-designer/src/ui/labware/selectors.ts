import { createSelector } from 'reselect'
import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'
import {
  getIsTiprack,
  getLabwareDisplayName,
  getLabwareHasQuirk,
} from '@opentrons/shared-data'
import { FIXED_TRASH_ID } from '../../constants'
import { i18n } from '../../localization'
import * as stepFormSelectors from '../../step-forms/selectors'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import { getModuleUnderLabware } from '../modules/utils'
import { Options } from '@opentrons/components'
import { LabwareEntity } from '@opentrons/step-generation'
import { Selector } from '../../types'
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
    // special case for fixed trash (always at the bottom of the list)
    if (a.value === FIXED_TRASH_ID) return 1
    if (b.value === FIXED_TRASH_ID) return -1
    // sort by name everything else by name
    return a.name.localeCompare(b.name)
  })

/** Returns options for labware dropdowns, excluding tiprack labware.
 * Ordered by display name / nickname, but with fixed trash at the bottom.
 */
export const getLabwareOptions: Selector<Options> = createSelector(
  stepFormSelectors.getLabwareEntities,
  getLabwareNicknamesById,
  stepFormSelectors.getInitialDeckSetup,
  stepFormSelectors.getPresavedStepForm,
  stepFormSelectors.getSavedStepForms,
  (
    labwareEntities,
    nicknamesById,
    initialDeckSetup,
    presavedStepForm,
    savedStepForms
  ) => {
    const moveLabwarePresavedStep = presavedStepForm?.stepType === 'moveLabware'
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
          savedStepForms,
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
          //  TODO(jr, 7/17/23): filter out moving trash for now in MoveLabware step type
          //  remove this when we support other slots for trash
          return nickName === 'Trash' || isAdapterOrAluminumBlock
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
    return _sortLabwareDropdownOptions(options)
  }
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
