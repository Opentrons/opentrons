// @flow
import fixture_regular_example_1 from '@opentrons/shared-data/labware/fixtures/2/fixture_regular_example_1'

export function v1LabwareModelToV2Def(model: string): string {
  // always use the same fixture
  return fixture_regular_example_1
}
