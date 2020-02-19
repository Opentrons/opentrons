// @flow
import values from 'lodash/values'
import { i18n } from '../../localization'
import type { ModuleType } from '@opentrons/shared-data'
import type { Options } from '@opentrons/components'
import type {
  ModuleOnDeck,
  LabwareOnDeck,
  InitialDeckSetup,
} from '../../step-forms/types'

export function getModuleOnDeckByType(
  initialDeckSetup: InitialDeckSetup,
  type: ModuleType
): ?ModuleOnDeck {
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
  let options = []
  if (module) {
    if (labware) {
      options = [
        {
          name: `${prefix} ${nicknamesById[labware.id]}`,
          value: module.id,
        },
      ]
    } else {
      options = [
        {
          name: `${prefix} No labware on module`,
          value: module.id,
        },
      ]
    }
  }

  return options
}

export function getModuleHasLabware(
  initialDeckSetup: InitialDeckSetup,
  type: ModuleType
): boolean {
  const module = getModuleOnDeckByType(initialDeckSetup, type)
  const labware = module && getLabwareOnModule(initialDeckSetup, module.id)
  return Boolean(module) && Boolean(labware)
}
