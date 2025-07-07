import { describe, expect, it } from 'vitest'

import { getMigrationMessage } from '../utils'

const tMock = (key: string) => key

describe('getMigrationMessage', () => {
  it('should return the generic migration message when migrating', () => {
    expect(JSON.stringify(getMigrationMessage({ t: tMock }))).toEqual(
      expect.stringContaining('migrations.generic.body1')
    )
  })
})
