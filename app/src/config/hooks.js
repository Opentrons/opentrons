// @flow
import { useSelector } from 'react-redux'

import type { State } from '../types'
import { getFeatureFlags } from './selectors'
import type { DevInternalFlag } from './types'

export const useFeatureFlag = (flag: DevInternalFlag): boolean => {
  return useSelector((state: State) => {
    const featureFlags = getFeatureFlags(state)
    return Boolean(featureFlags[flag])
  })
}
