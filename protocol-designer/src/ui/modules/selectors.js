// @flow
import { createSelector } from 'reselect'

import { selectors as stepFormSelectors } from '../../step-forms'
import {
  getModuleLabwareOptions,
  getModuleOnDeckByType,
  getModuleHasLabware,
} from './utils'
import { getLabwareNicknamesById } from '../labware/selectors'
import type { Options } from '@opentrons/components'
import type { Selector } from '../../types'

/** Returns dropdown option for labware placed on magnetic module */
export const getMagneticLabwareOptions: Selector<Options> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  getLabwareNicknamesById,
  (initialDeckSetup, nicknamesById) => {
    return getModuleLabwareOptions(initialDeckSetup, nicknamesById, 'magdeck')
  }
)

/** Returns dropdown option for labware placed on temperature module */
export const getTemperatureLabwareOptions: Selector<Options> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  getLabwareNicknamesById,
  (initialDeckSetup, nicknamesById) => {
    return getModuleLabwareOptions(initialDeckSetup, nicknamesById, 'tempdeck')
  }
)

/** Returns dropdown option for labware placed on thermocycler module */
export const getThermocyclerLabwareOptions: Selector<Options> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  getLabwareNicknamesById,
  (initialDeckSetup, nicknamesById) => {
    return getModuleLabwareOptions(
      initialDeckSetup,
      nicknamesById,
      'thermocycler'
    )
  }
)

/** Get single magnetic module (assumes no multiples) */
export const getSingleMagneticModuleId: Selector<
  string | null
> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  initialDeckSetup =>
    getModuleOnDeckByType(initialDeckSetup, 'magdeck')?.id || null
)

/** Returns boolean if magnetic module has labware */
export const getMagnetModuleHasLabware: Selector<boolean> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  initialDeckSetup => {
    return getModuleHasLabware(initialDeckSetup, 'magdeck')
  }
)
