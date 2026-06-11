import {
  getLabwareDefIsStandard,
  locationIsOffDeck,
} from '@opentrons/shared-data'

import { getLabwareCompatibleWithModule } from '../../utils/labwareModuleCompatibility'

import { getIsVacuumSpacer } from '@opentrons/step-generation'

import type { LabwareLocation } from '@opentrons/shared-data'
import type {
  InvariantContext,
  LabwareEntity,
} from '@opentrons/step-generation'
import type { HydratedFormData } from '../../form-types'
import type { ProfileFormError } from './profileErrors'

const getMoveLabwareError = (
  labware: LabwareEntity,
  newLocation: LabwareLocation,
  invariantContext: InvariantContext
): string | null => {
  let errorString: string | null = null
  if (
    labware == null ||
    newLocation == null ||
    locationIsOffDeck(newLocation) ||
    !getLabwareDefIsStandard(labware?.def)
  ) {
    return null
  }
  if ('moduleId' in newLocation) {
    const moduleType =
      invariantContext.moduleEntities[newLocation.moduleId].type
    errorString = !getLabwareCompatibleWithModule(labware.def, moduleType)
      ? 'Labware incompatible with this module'
      : null
  } else if ('labwareId' in newLocation) {
    const adapterDef =
      invariantContext.labwareEntities[newLocation.labwareId].def
    const adapterLoadName = adapterDef.parameters.loadName
    const adapterProvidesStackingDefault =
      adapterDef.parameters.quirks?.includes('providesStackingDefault') ?? false
    const adapterIsVacuumSpacer = getIsVacuumSpacer(adapterDef)
    const movingLabwareIsFilterPlate =
      labware?.def.parameters.quirks?.includes('filterPlate') ?? false
    const movingLabwareIsCollar =
      labware?.def.parameters.quirks?.includes('vacuumModuleDock') ?? false
    const adapterIsLid = adapterDef.allowedRoles?.includes('lid') ?? false
    const adapterIsTiprack = adapterDef.parameters.isTiprack
    const adapterIsFilterPlate =
      adapterDef.parameters.quirks?.includes('filterPlate') ?? false

    if (
      (movingLabwareIsFilterPlate &&
        !adapterIsLid &&
        !adapterIsTiprack &&
        !adapterIsFilterPlate) ||
      (adapterIsVacuumSpacer && movingLabwareIsCollar) ||
      (adapterProvidesStackingDefault && !adapterIsVacuumSpacer) ||
      labware?.def.parameters.loadName === 'opentrons_tough_universal_lid'
    ) {
      errorString = null
    } else if (
      labware?.def.compatibleParentLabware?.some(
        loadName => loadName === adapterLoadName
      )
    ) {
      errorString = null
    } else {
      errorString =
        labware?.def.stackingOffsetWithLabware?.[adapterLoadName] == null
          ? 'Labware incompatible with this adapter'
          : null
    }
  }
  return errorString
}

export const getMoveLabwareFormErrors = (
  hydratedForm: HydratedFormData,
  invariantContext: InvariantContext
): ProfileFormError[] => {
  if (hydratedForm.stepType !== 'moveLabware') {
    return []
  }

  const labware = hydratedForm.labware as LabwareEntity
  const newLocation = hydratedForm.newLocation as LabwareLocation

  const errorString = getMoveLabwareError(
    labware,
    newLocation,
    invariantContext
  )

  return errorString != null
    ? ([
        {
          title: errorString,
          dependentProfileFields: ['newLocation'],
          location: ['field'],
          showOnReopen: true,
        },
      ] as ProfileFormError[])
    : []
}
