import fixtureP10SingleGeneral from '../../pipette/definitions/2/general/single_channel/p10/1_0.json'
import fixtureP10SingleGeometry from '../../pipette/definitions/2/geometry/single_channel/p10/1_0.json'
import fixturep10SingleLiquids from '../../pipette/definitions/2/liquid/single_channel/p10/default/1_0.json'
import fixtureP10MultiGeneral from '../../pipette/definitions/2/general/eight_channel/p10/1_0.json'
import fixtureP10MultiGeometry from '../../pipette/definitions/2/geometry/eight_channel/p10/1_0.json'
import fixtureP10MultiLiquids from '../../pipette/definitions/2/liquid/eight_channel/p10/default/1_0.json'
import fixtureP300SingleGeneral from '../../pipette/definitions/2/general/single_channel/p300/1_0.json'
import fixtureP300SingleGeometry from '../../pipette/definitions/2/geometry/single_channel/p300/1_0.json'
import fixtureP300SingleLiquids from '../../pipette/definitions/2/liquid/single_channel/p300/default/1_0.json'
import fixtureP300MultiGeneral from '../../pipette/definitions/2/general/eight_channel/p300/1_0.json'
import fixtureP300MultiGeometry from '../../pipette/definitions/2/geometry/eight_channel/p300/1_0.json'
import fixtureP300MultiLiquids from '../../pipette/definitions/2/liquid/eight_channel/p300/default/1_0.json'
import fixtureP100096General from '../../pipette/definitions/2/general/ninety_six_channel/p1000/1_0.json'
import fixtureP100096Geometry from '../../pipette/definitions/2/geometry/ninety_six_channel/p1000/1_0.json'
import fixtureP100096Liquids from '../../pipette/definitions/2/liquid/ninety_six_channel/p1000/default/1_0.json'
import fixtureP1000SingleGeneral from '../../pipette/definitions/2/general/single_channel/p1000/1_0.json'
import fixtureP1000SingleGeometry from '../../pipette/definitions/2/geometry/single_channel/p1000/1_0.json'
import fixtureP1000SingleLiquids from '../../pipette/definitions/2/liquid/single_channel/p1000/default/1_0.json'

import type { PipetteV2Specs } from '../../js'

//  need to type as any first because channels and displayCategory types are
//  incompatible.
export const fixtureP10SingleV2Specs: PipetteV2Specs = {
  ...fixtureP10SingleGeneral,
  ...fixtureP10SingleGeometry,
  liquids: { default: { ...fixturep10SingleLiquids } },
} as any

export const fixtureP10MultiV2Specs: PipetteV2Specs = {
  ...fixtureP10MultiGeneral,
  ...fixtureP10MultiGeometry,
  liquids: { default: { ...fixtureP10MultiLiquids } },
} as any

export const fixtureP300SingleV2Specs: PipetteV2Specs = {
  ...fixtureP300SingleGeneral,
  ...fixtureP300SingleGeometry,
  liquids: { default: { ...fixtureP300SingleLiquids } },
} as any

export const fixtureP300MultiV2Specs: PipetteV2Specs = {
  ...fixtureP300MultiGeneral,
  ...fixtureP300MultiGeometry,
  liquids: { default: { ...fixtureP300MultiLiquids } },
} as any

export const fixtureP100096V2Specs: PipetteV2Specs = {
  ...fixtureP100096General,
  ...fixtureP100096Geometry,
  liquids: { default: { ...fixtureP100096Liquids } },
} as any

export const fixtureP1000SingleV2Specs: PipetteV2Specs = {
  ...fixtureP1000SingleGeneral,
  ...fixtureP1000SingleGeometry,
  liquids: { default: { ...fixtureP1000SingleLiquids } },
} as any
