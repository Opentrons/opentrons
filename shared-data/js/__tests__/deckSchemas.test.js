/** Ensure that protocol schema v4 definition itself is functions as intended,
 *  and that all v4 protocol fixtures will validate */
import path from 'path'
import Ajv from 'ajv'
import glob from 'glob'

import deckSchemaV1 from '../../deck/schemas/1.json'
import deckSchemaV2 from '../../deck/schemas/2.json'

const v1FixtureGlob = path.join(__dirname, '../../deck/fixtures/1/*.json')
const v2FixtureGlob = path.join(__dirname, '../../deck/fixtures/2/*.json')
const v1DefGlob = path.join(__dirname, '../../deck/definitions/1/*.json')
const v2DefGlob = path.join(__dirname, '../../deck/definitions/2/*.json')

const ajv = new Ajv({ allErrors: true, jsonPointers: true })

const validateV1Schema = ajv.compile(deckSchemaV1)
const validateV2Schema = ajv.compile(deckSchemaV2)

describe('validate deck defs and fixtures', () => {
  const v1Fixtures = glob.sync(v1FixtureGlob)
  v1Fixtures.forEach(fixturePath => {
    const fixtureDef = require(fixturePath)
    it('fixture validates against v1 schema', () => {
      const valid = validateV1Schema(fixtureDef)
      const validationErrors = validateV1Schema.errors
      if (validationErrors) {
        console.log(
          path.parse(fixturePath).base +
            ' ' +
            JSON.stringify(validationErrors, null, 4)
        )
      }
      expect(validationErrors).toBe(null)
      expect(valid).toBe(true)
    })
  })
  const v2Fixtures = glob.sync(v2FixtureGlob)
  v2Fixtures.forEach(fixturePath => {
    const fixtureDef = require(fixturePath)
    it('fixture validates against v2 schema', () => {
      const valid = validateV2Schema(fixtureDef)
      const validationErrors = validateV2Schema.errors
      if (validationErrors) {
        console.log(
          path.parse(fixturePath).base +
            ' ' +
            JSON.stringify(validationErrors, null, 4)
        )
      }
      expect(validationErrors).toBe(null)
      expect(valid).toBe(true)
    })
  })
  const v1Defs = glob.sync(v1DefGlob)
  v1Defs.forEach(defPath => {
    const deckDef = require(defPath)
    it('deck validates against v1 schema', () => {
      const valid = validateV1Schema(deckDef)
      const validationErrors = validateV1Schema.errors
      if (validationErrors) {
        console.log(
          path.parse(defPath).base +
            ' ' +
            JSON.stringify(validationErrors, null, 4)
        )
      }
      expect(validationErrors).toBe(null)
      expect(valid).toBe(true)
    })
  })
  const v2Defs = glob.sync(v2DefGlob)
  v2Defs.forEach(defPath => {
    const deckDef = require(defPath)
    it('deck validates against v2 schema', () => {
      const valid = validateV2Schema(deckDef)
      const validationErrors = validateV2Schema.errors
      if (validationErrors) {
        console.log(
          path.parse(defPath).base +
            ' ' +
            JSON.stringify(validationErrors, null, 4)
        )
      }
      expect(validationErrors).toBe(null)
      expect(valid).toBe(true)
    })
  })
})
