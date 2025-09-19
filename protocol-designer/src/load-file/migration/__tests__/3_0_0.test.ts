import { describe, expect, it, vi } from 'vitest'

import example_1_1_0 from '../../../../fixtures/protocol/1/example_1_1_0.json'
import { migrateFile } from '../3_0_0'

vi.mock('../../../labware-defs/utils')
vi.mock('../utils/v1LabwareModelToV2Def')
describe('migrate to 3.0.0', () => {
  it('snapshot test', () => {
    // @ts-expect-error paramater is not explicitly type PDProtocolFile
    const result = migrateFile(example_1_1_0)
    expect(result).toMatchSnapshot()
  })
})
