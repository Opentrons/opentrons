import path from 'path'
import glob from 'glob'
import Ajv from 'ajv'
import { describe, expect, it, beforeAll, test } from 'vitest'

import schema from '../../labware/schemas/3.json'
import type { LabwareDefinition3} from '../types'
import {LabwareDefinition2} from "../types";
// import {LabwareDefinition3} from "../types";

// const definitionsDir = path.join(__dirname, '../../labware/definitions/3')
const fixturesDir = path.join(__dirname, '../../labware/fixtures/3')
const globPattern = '**/*.json'

// JSON Schema definition & setup
const ajv = new Ajv({ allErrors: true, jsonPointers: true })
const validate = ajv.compile(schema)

const checkGeometryDefinitions = (
    labwareDef: LabwareDefinition3,
    filename: string
) : void => {
    test(`all geometryDefinitionIds specified in {filename} should have an accompanying valid entry in innerLabwareGeometry`, () => {
        for (const wellName in labwareDef.wells ) {
            debugger;
            const wellGeometryId = labwareDef[wellName].geometryDefinitionId
            expect(
                wellGeometryId in labwareDef.innerLabwareGeometry
            ).toBe(true)

            const wellDepth = labwareDef[wellName].depth
            const topFrustumHeight = labwareDef.innerLabwareGeometry[wellGeometryId].frusta[0].topHeight
            expect(wellDepth).toBeEqualTo(topFrustumHeight)
        }
    })

}

describe(`test additions to labware schema in v3`, () => {

    const labwarePaths = glob.sync(globPattern, {cwd: fixturesDir})

    beforeAll(() => {
        // Make sure definitions path didn't break, which would give you false positives
        expect(labwarePaths.length).toBeGreaterThan(0)
    })

    labwarePaths.forEach(labwarePath => {
        // const filename = path.parse(labwarePath).base
        const fullLabwarePath = path.join(fixturesDir, labwarePath)
        const labwareDef = require(fullLabwarePath) as LabwareDefinition3

        checkGeometryDefinitions(labwareDef, labwarePath)
    })


})

// check that frustum boundaries are correct relationally
    // top height of first element in frustum list should be the same as well depth
    // for each well, its frustum wellshape should be equal to the geometry of the first element in
    // its 'frusta' list

  // fixture that has bad frustum math
  // fixture that has good frustum math

// check that inner well geometry items have the correct structure using ajv
  // fixture good structure
  // fixture bad structure

    // need to make sure that wells with a geometrydefinitionid have a valid matching geometry definition that exists
    // might be a thing to put in python ^
