import { migrateFile } from '../3_0_0'
import example_1_1_0 from '../../../../fixtures/protocol/1/example_1_1_0.json'

jest.mock('../../../labware-defs/utils')
jest.mock('../utils/v1LabwareModelToV2Def')

describe('migrate to 3.0.0', () => {
  it('snapshot test', () => {
    const result = migrateFile(example_1_1_0)
    expect(result).toMatchSnapshot()
  })
})
