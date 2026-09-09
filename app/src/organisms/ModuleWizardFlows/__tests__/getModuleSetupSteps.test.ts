import { describe, expect, it } from 'vitest'

import {
  ABSORBANCE_READER_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'

import { SECTIONS } from '../constants'
import { getModuleSetupSteps } from '../getModuleSetupSteps'

describe('getModuleSetupSteps', () => {
  it('includes vacuum verification after deck configuration', () => {
    expect(getModuleSetupSteps(VACUUM_MODULE_TYPE)).toEqual([
      { section: SECTIONS.UPDATE_FIRMWARE },
      { section: SECTIONS.SELECT_LOCATION },
      { section: SECTIONS.VERIFY_VACUUM },
      { section: SECTIONS.SUCCESS },
    ])
  })

  it('does not add vacuum verification for other modules', () => {
    expect(getModuleSetupSteps(ABSORBANCE_READER_TYPE)).not.toContainEqual({
      section: SECTIONS.VERIFY_VACUUM,
    })
    expect(getModuleSetupSteps(FLEX_STACKER_MODULE_TYPE)).not.toContainEqual({
      section: SECTIONS.VERIFY_VACUUM,
    })
    expect(getModuleSetupSteps(HEATERSHAKER_MODULE_TYPE)).not.toContainEqual({
      section: SECTIONS.VERIFY_VACUUM,
    })
  })
})
