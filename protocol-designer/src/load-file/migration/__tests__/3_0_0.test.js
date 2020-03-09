import { migrateFile } from '../3_0_0'
import example_1_1_0 from '../../__tests__/fixtures/v1_1_0/example_1_1_0'

jest.mock('../../../labware-defs/utils')
jest.mock('../utils/v1LabwareModelToV2Def')

describe('migrate to 3.0.0', () => {
  it('snapshot test', () => {
    const result = migrateFile(example_1_1_0)
    expect(result).toMatchSnapshot()
  })
})
