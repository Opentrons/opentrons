import { CutoutFixtureId } from "@opentrons/shared-data";

export interface CutoutConfigAndCompatibility extends CutoutConfigProtocolSpec {
  compatibleCutoutFixtureIds: CutoutFixtureId[]
}