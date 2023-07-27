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
  (labwareEntities, nicknamesById, initialDeckSetup, presavedStepForm) => {
    const isMoveLabware = presavedStepForm?.stepType === 'moveLabware'
    const options = reduce(
      labwareEntities,
      (
        acc: Options,
        labwareEntity: LabwareEntity,
        labwareId: string
      ): Options => {
        const moduleOnDeck = getModuleUnderLabware(initialDeckSetup, labwareId)
        const prefix = moduleOnDeck
          ? i18n.t(
              `form.step_edit_form.field.moduleLabwarePrefix.${moduleOnDeck.type}`
            )
          : null
        const nickName =
          //  todo(jr, 7/27/23): for now we are filtering out the module info for MoveLabware since it is getting labware from initial deck setup
          //  and never updates if the labware is moved. Should find a way to get updated deck state though!
          prefix && !isMoveLabware
            ? `${prefix} ${nicknamesById[labwareId]}`
            : nicknamesById[labwareId]
        return getIsTiprack(labwareEntity.def)
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
    return _sortLabwareDropdownOptions(options)
  }
)

export const getTiprackOptions: Selector<Options> = createSelector(
  stepFormSelectors.getLabwareEntities,
  getLabwareNicknamesById,
  (labwareEntities, nicknamesById) => {
    const options = reduce(
      labwareEntities,
      (
        acc: Options,
        labwareEntity: LabwareEntity,
        labwareId: string
      ): Options => {
        const labwareDefURI = labwareEntity.labwareDefURI
        const labwareDefURIs = acc.map(option => option.value.split(':')[1])
        if (
          labwareDefURIs.includes(labwareDefURI) ||
          !getIsTiprack(labwareEntity.def)
        ) {
          return acc
        } else {
          return [
            ...acc,
            {
              name: nicknamesById[labwareId],
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
