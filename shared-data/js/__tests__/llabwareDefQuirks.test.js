import path from 'path'
import glob from 'glob'

const definitionsGlobPath = path.join(
  __dirname,
  '../../labware/definitions/2/**/*.json'
)

const validQuirks = [
  "centerMultichannelOnWells",
  "touchTipDisabled",
  "fixedTrash"
]

describe('check quirks for all labware defs', () => {
  const labwarePaths = glob.sync(definitionsGlobPath)
  test(`path to definitions OK`, () => {
    // Make sure definitions path didn't break, which would give you false positives
    expect(labwarePaths.length).toBeGreaterThan(0)
  })
  labwarePaths.forEach(labwarePath => {
    const filename = path.parse(labwarePath).base
    const labwareDef = require(labwarePath)
    if(labwareDef.parameters.quirks) {
      test(`${filename} has valid quirks`, () => {
        // we want to test that the quirks in the def are a subset of validQuirks,
        // whereas arrayContaining tests that the expected value is a subset of
        // the value under test. Unfortunately that means we have to do it backwards
        expect(validQuirks).toEqual(expect.arrayContaining(labwareDef.parameters.quirks))
      })
    }
  })
})
