import { fixture_regular_example_1 } from '@opentrons/shared-data/labware/fixtures/2'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
export function v1LabwareModelToV2Def(model: string): LabwareDefinition2 {
  // always use the same fixture
  return fixture_regular_example_1 as LabwareDefinition2
}
