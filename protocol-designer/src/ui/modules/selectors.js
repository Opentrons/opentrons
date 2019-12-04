// @flow
import { createSelector } from 'reselect'
import values from 'lodash/values'
import i18n from '../../localization'
import { selectors as stepFormSelectors } from '../../step-forms'
import { selectors as uiLabwareSelectors } from '../labware'
import type { Options } from '@opentrons/components'
import { type ModuleType } from '@opentrons/shared-data'
import type { Selector } from '../../types'
import type {
  ModuleOnDeck,
  LabwareOnDeck,
  ModuleEntity,
  InitialDeckSetup,
} from '../../step-forms/types'

export function getModuleOnDeckByType(
  initialDeckSetup: InitialDeckSetup,
  type: ModuleType
): ?ModuleEntity {
  return values(initialDeckSetup.modules).find(
    (module: ModuleOnDeck) => module.type === type
  )
}

export function getLabwareOnModule(
  initialDeckSetup: InitialDeckSetup,
  moduleId: string
): ?LabwareOnDeck {
  return values(initialDeckSetup.labware).find(
    (lab: LabwareOnDeck) => lab.slot === moduleId
  )
}

export function getModuleLabwareOptions(
  initialDeckSetup: InitialDeckSetup,
  nicknamesById: { [labwareId: string]: string },
  type: ModuleType
): Options {
  const module = getModuleOnDeckByType(initialDeckSetup, type)
  const labware = module && getLabwareOnModule(initialDeckSetup, module.id)
  const prefix = i18n.t(`form.step_edit_form.field.moduleLabwarePrefix.${type}`)
  const options =
    module && labware
      ? [
          {
            name: `${prefix} ${nicknamesById[labware.id]}`,
            value: module.id,
          },
        ]
      : []
  return options
}

/** Returns drowdown option for labware placed on magnetic module */
export const getMagneticLabwareOptions: Selector<Options> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  uiLabwareSelectors.getLabwareNicknamesById,
  (initialDeckSetup, nicknamesById) => {
    return getModuleLabwareOptions(initialDeckSetup, nicknamesById, 'magdeck')
  }
)

/** Returns drowdown option for labware placed on temperature module */
export const getTemperatureLabwareOptions: Selector<Options> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  uiLabwareSelectors.getLabwareNicknamesById,
  (initialDeckSetup, nicknamesById) => {
    return getModuleLabwareOptions(initialDeckSetup, nicknamesById, 'tempdeck')
  }
)

/** Returns drowdown option for labware placed on thermocycler module */
export const getThermocyclerLabwareOptions: Selector<Options> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  uiLabwareSelectors.getLabwareNicknamesById,
  (initialDeckSetup, nicknamesById) => {
    return getModuleLabwareOptions(
      initialDeckSetup,
      nicknamesById,
      'thermocycler'
    )
  }
)
