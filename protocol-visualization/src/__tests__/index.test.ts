import { describe, expect, it } from 'vitest'

import { ProtocolVisualization } from '../index'

describe('@opentrons/protocol-visualization', () => {
  it('exposes stable package name', () => {
    expect(ProtocolVisualization()).toBe(
      '@opentrons/protocol-visualization'
    )
  })
})
