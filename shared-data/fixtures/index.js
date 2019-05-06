// @flow
// These are copies of labware defs and pipette name specs to use in tests
// The labware defs' `otId` fields have been changed to match the fixture names
// (ex fixture96Plate has otId: 'fixture96Plate')
import pipetteNameSpecFixtures from './pipetteNameSpecFixtures'

import fixture12Trough from './fixture12Trough'
import fixture24TubeRack from './fixture24TubeRack'
import fixture96Plate from './fixture96Plate'
import fixture384Plate from './fixture384Plate'
import fixtureTipRack10Ul from './fixtureTipRack10Ul'
import fixtureTipRack300Ul from './fixtureTipRack300Ul'
import fixtureTipRack1000Ul from './fixtureTipRack1000Ul'
import fixtureTrash from './fixtureTrash'

export {
  fixture12Trough,
  fixture24TubeRack,
  fixture96Plate,
  fixture384Plate,
  fixtureTipRack10Ul,
  fixtureTipRack300Ul,
  fixtureTipRack1000Ul,
  fixtureTrash,
}

export const fixtureP10Single = pipetteNameSpecFixtures['p10_single']
export const fixtureP10Multi = pipetteNameSpecFixtures['p10_multi']
export const fixtureP300Single = pipetteNameSpecFixtures['p300_single']
export const fixtureP300Multi = pipetteNameSpecFixtures['p300_multi']
export const fixtureP1000Single = pipetteNameSpecFixtures['p1000_single']
export const fixtureP1000Multi = pipetteNameSpecFixtures['p1000_multi']
