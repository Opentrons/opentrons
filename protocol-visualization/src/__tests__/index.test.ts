import { describe, expect, it } from 'vitest'

import { ProtocolVisualization } from '../index'

describe('@opentrons/protocol-visualization', () => {
  it('exports ProtocolVisualization component', () => {
    expect(typeof ProtocolVisualization).toBe('function')
  })
})
