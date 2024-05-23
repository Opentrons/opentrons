import { createSelector } from 'reselect'
import mapValues from 'lodash/mapValues'
import {
  getLabwareDisplayName,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { getInitialDeckSetup } from '../../step-forms/selectors'
import { getLabwareNicknamesById } from '../labware/selectors'
import {
  getModuleLabwareOptions,
  getLabwareOnModule,
  getModuleOnDeckByType,
  getModuleHasLabware,
  getMagnetLabwareEngageHeight as getMagnetLabwareEngageHeightUtil,
  getModulesOnDeckByType,
  getModulesHaveLabware,
} from './utils'
import type { ModuleAndLabware } from './utils'
import type { Options } from '@opentrons/components'
import type { Selector } from '../../types'
import type { LabwareNamesByModuleId } from '../../steplist/types'

export const getLabwareNamesByModuleId: Selector<LabwareNamesByModuleId> = createSelector(
  getInitialDeckSetup,
  getLabwareNicknamesById,
  (initialDeckSetup, nicknamesById) =>
    mapValues(initialDeckSetup.modules, (_, moduleId) => {
      const labware = getLabwareOnModule(initialDeckSetup, moduleId)
      return labware
        ? {
            nickname: nicknamesById[labware.id],
            displayName: getLabwareDisplayName(labware.def),
          }
        : null
    })
)

/** Returns dropdown option for labware placed on magnetic module */
export const getMagneticLabwareOptions: Selector<Options> = createSelector(
  getInitialDeckSetup,
  getLabwareNicknamesById,
  (initialDeckSetup, nicknamesById) => {
    return getModuleLabwareOptions(
      initialDeckSetup,
      nicknamesById,
      MAGNETIC_MODULE_TYPE
    )
  }
)

/** Returns dropdown option for labware placed on temperature module */
export const getTemperatureLabwareOptions: Selector<Options> = createSelector(
  getInitialDeckSetup,
  getLabwareNicknamesById,
  (initialDeckSetup, nicknamesById) => {
    const temperatureModuleOptions = getModuleLabwareOptions(
      initialDeckSetup,
      nicknamesById,
      TEMPERATURE_MODULE_TYPE
    )
    return temperatureModuleOptions
  }
)

/** Returns dropdown option for labware placed on heater shaker module */
export const getHeaterShakerLabwareOptions: Selector<Options> = createSelector(
  getInitialDeckSetup,
  getLabwareNicknamesById,
  (initialDeckSetup, nicknamesById) => {
    const heaterShakerModuleOptions = getModuleLabwareOptions(
      initialDeckSetup,
      nicknamesById,
      HEATERSHAKER_MODULE_TYPE
    )
    return heaterShakerModuleOptions
  }
)

/** Get single magnetic module (assumes no multiples) */
export const getSingleMagneticModuleId: Selector<
  string | null
> = createSelector(
  getInitialDeckSetup,
  initialDeckSetup =>
    getModuleOnDeckByType(initialDeckSetup, MAGNETIC_MODULE_TYPE)?.id || null
)

/** Get all temperature modules */
export const getTemperatureModuleIds: Selector<
  string[] | null
> = createSelector(
  getInitialDeckSetup,
  initialDeckSetup =>
    getModulesOnDeckByType(initialDeckSetup, TEMPERATURE_MODULE_TYPE)?.map(
      module => module.id
    ) || null
)

/** Get single thermocycler module (assumes no multiples) */
export const getSingleThermocyclerModuleId: Selector<
  string | null
> = createSelector(
  getInitialDeckSetup,
  initialDeckSetup =>
    getModuleOnDeckByType(initialDeckSetup, THERMOCYCLER_MODULE_TYPE)?.id ||
    null
)

/** Returns boolean if magnetic module has labware */
export const getMagnetModuleHasLabware: Selector<boolean> = createSelector(
  getInitialDeckSetup,
  initialDeckSetup => {
    return getModuleHasLabware(initialDeckSetup, MAGNETIC_MODULE_TYPE)
  }
)

/** Returns boolean if heater-shaker module has labware */
export const getHeaterShakerModuleHasLabware: Selector<boolean> = createSelector(
  getInitialDeckSetup,
  initialDeckSetup => {
    return getModuleHasLabware(initialDeckSetup, HEATERSHAKER_MODULE_TYPE)
  }
)

/** Returns all moduleIds and if they have labware for MoaM */
export const getTemperatureModulesHaveLabware: Selector<
  ModuleAndLabware[]
> = createSelector(getInitialDeckSetup, initialDeckSetup => {
  return getModulesHaveLabware(initialDeckSetup, TEMPERATURE_MODULE_TYPE)
})

/** Returns boolean if thermocycler module has labware */
export const getThermocyclerModuleHasLabware: Selector<boolean> = createSelector(
  getInitialDeckSetup,
  initialDeckSetup => {
    return getModuleHasLabware(initialDeckSetup, THERMOCYCLER_MODULE_TYPE)
  }
)
export const getMagnetLabwareEngageHeight: Selector<
  number | null
> = createSelector(
  getInitialDeckSetup,
  getSingleMagneticModuleId,
  (initialDeckSetup, magnetModuleId) =>
    getMagnetLabwareEngageHeightUtil(initialDeckSetup, magnetModuleId)
)

/** Returns boolean if Temperature Module is present on deck  */
export const getTempModuleIsOnDeck: Selector<boolean> = createSelector(
  getInitialDeckSetup,
  initialDeckSetup => {
    const tempOnDeck = getModuleOnDeckByType(
      initialDeckSetup,
      TEMPERATURE_MODULE_TYPE
    )
    return Boolean(tempOnDeck)
  }
)

export const getHeaterShakerModuleIsOnDeck: Selector<boolean> = createSelector(
  getInitialDeckSetup,
  initialDeckSetup => {
    const heaterShakerOnDeck = getModuleOnDeckByType(
      initialDeckSetup,
      HEATERSHAKER_MODULE_TYPE
    )
    return Boolean(heaterShakerOnDeck)
  }
)
