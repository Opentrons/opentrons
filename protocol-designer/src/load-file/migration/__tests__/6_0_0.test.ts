import { migrateFile } from '../6_0_0'
import example_5_2_0 from '@opentrons/shared-data/protocol/fixtures/5/multipleTipracksWithTC.json'

jest.mock('../../../labware-defs/utils')
jest.mock('../utils/v1LabwareModelToV2Def')
describe('migrate to 6.0.0', () => {
  it('snapshot test', () => {
    const result = migrateFile(example_5_2_0)
    expect(result).toMatchSnapshot()
  })
})
