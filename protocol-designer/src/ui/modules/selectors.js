// @flow
import { createSelector } from 'reselect'
import {
  getLabwareDisplayName,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import mapValues from 'lodash/mapValues'
import { getInitialDeckSetup } from '../../step-forms/selectors'
import { getLabwareNicknamesById } from '../labware/selectors'
import {
  getModuleLabwareOptions,
  getLabwareOnModule,
  getModuleOnDeckByType,
  getModuleHasLabware,
  getMagnetLabwareEngageHeight as getMagnetLabwareEngageHeightUtil,
} from './utils'
import type { Options } from '@opentrons/components'
import type { Selector } from '../../types'

export type LabwareNameByModuleId = {
  [moduleId: string]: ?{ nickname: ?string, displayName: string },
  ...,
}
export const getLabwareNamesByModuleId: Selector<LabwareNameByModuleId> = createSelector(
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

/** Get single magnetic module (assumes no multiples) */
export const getSingleMagneticModuleId: Selector<
  string | null
> = createSelector(
  getInitialDeckSetup,
  initialDeckSetup =>
    getModuleOnDeckByType(initialDeckSetup, MAGNETIC_MODULE_TYPE)?.id || null
)

/** Get single temperature module (assumes no multiples) */
export const getSingleTemperatureModuleId: Selector<
  string | null
> = createSelector(
  getInitialDeckSetup,
  initialDeckSetup =>
    getModuleOnDeckByType(initialDeckSetup, TEMPERATURE_MODULE_TYPE)?.id || null
)

/** Get single temperature module (assumes no multiples) */
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

/** Returns boolean if temperature module has labware */
export const getTemperatureModuleHasLabware: Selector<boolean> = createSelector(
  getInitialDeckSetup,
  initialDeckSetup => {
    return getModuleHasLabware(initialDeckSetup, TEMPERATURE_MODULE_TYPE)
  }
)

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
