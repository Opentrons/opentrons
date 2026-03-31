import { describe, expect, it } from 'vitest'

import { getProtocolVisualizationPackageName } from '../index'

describe('@opentrons/protocol-visualization', () => {
  it('exposes stable package name', () => {
    expect(getProtocolVisualizationPackageName()).toBe(
      '@opentrons/protocol-visualization'
    )
  })
})
