// @flow
import values from 'lodash/values'
import { i18n } from '../../localization'
import type { ModuleRealType } from '@opentrons/shared-data'
import type { Options } from '@opentrons/components'
import type {
  ModuleOnDeck,
  LabwareOnDeck,
  InitialDeckSetup,
} from '../../step-forms/types'

export function getModuleOnDeckByType(
  initialDeckSetup: InitialDeckSetup,
  type: ModuleRealType
): ?ModuleOnDeck {
  return values(initialDeckSetup.modules).find(
    (moduleOnDeck: ModuleOnDeck) => moduleOnDeck.type === type
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

export function getModuleUnderLabware(
  initialDeckSetup: InitialDeckSetup,
  labwareId: string
): ?ModuleOnDeck {
  return values(initialDeckSetup.modules).find(
    (moduleOnDeck: ModuleOnDeck) =>
      initialDeckSetup.labware[labwareId]?.slot === moduleOnDeck.id
  )
}

export function getModuleLabwareOptions(
  initialDeckSetup: InitialDeckSetup,
  nicknamesById: { [labwareId: string]: string },
  type: ModuleRealType
): Options {
  const moduleOnDeck = getModuleOnDeckByType(initialDeckSetup, type)
  const labware =
    moduleOnDeck && getLabwareOnModule(initialDeckSetup, moduleOnDeck.id)
  const prefix = i18n.t(`form.step_edit_form.field.moduleLabwarePrefix.${type}`)
  let options = []
  if (moduleOnDeck) {
    if (labware) {
      options = [
        {
          name: `${prefix} ${nicknamesById[labware.id]}`,
          value: moduleOnDeck.id,
        },
      ]
    } else {
      options = [
        {
          name: `${prefix} No labware on module`,
          value: moduleOnDeck.id,
        },
      ]
    }
  }

  return options
}

export function getModuleHasLabware(
  initialDeckSetup: InitialDeckSetup,
  type: ModuleRealType
): boolean {
  const moduleOnDeck = getModuleOnDeckByType(initialDeckSetup, type)
  const labware =
    moduleOnDeck && getLabwareOnModule(initialDeckSetup, moduleOnDeck.id)
  return Boolean(moduleOnDeck) && Boolean(labware)
}
