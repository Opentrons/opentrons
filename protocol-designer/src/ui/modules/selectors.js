// @flow
import { createSelector } from 'reselect'

import * as uiLabwareSelectors from '../labware/selectors'
import { selectors as stepFormSelectors } from '../../step-forms'
import { getModuleLabwareOptions, getModuleOnDeckByType } from './utils'
import type { Options } from '@opentrons/components'
import type { Selector } from '../../types'

/** Returns dropdown option for labware placed on magnetic module */
export const getMagneticLabwareOptions: Selector<Options> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  uiLabwareSelectors.getLabwareNicknamesById,
  (initialDeckSetup, nicknamesById) => {
    return getModuleLabwareOptions(initialDeckSetup, nicknamesById, 'magdeck')
  }
)

/** Returns dropdown option for labware placed on temperature module */
export const getTemperatureLabwareOptions: Selector<Options> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  uiLabwareSelectors.getLabwareNicknamesById,
  (initialDeckSetup, nicknamesById) => {
    return getModuleLabwareOptions(initialDeckSetup, nicknamesById, 'tempdeck')
  }
)

/** Returns dropdown option for labware placed on thermocycler module */
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

/** Get single magnetic module (assumes no multiples) */
export const getSingleMagneticModuleId: Selector<
  string | null
> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  initialDeckSetup =>
    getModuleOnDeckByType(initialDeckSetup, 'magdeck')?.id || null
)
