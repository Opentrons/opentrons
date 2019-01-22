// @flow
import handleFormChangeMoveLiquid from '../handleFormChangeMoveLiquid'

// TODO IMMEDIATELY: set up in beforeEach (nested???)
const pipetteEntities = {}
const labwareEntities = {}
const singleWell = ['A1']
const multiWells = ['A2', 'A3']
const handleFormHelper = (patch, baseForm) => handleFormChangeMoveLiquid(
  patch, baseForm, pipetteEntities, labwareEntities
)

// n:n → 1:many
//   changeTip: perSource → always
//   All path choices compatible
// n:n → Many:1
//   All path + changeTip choices compatible
// 1:many → n:n
//   changeTip: perDest → always
//   All path choices compatible
// 1:many → Many:1
//   changeTip: perSource → always
//   path: multiDispense → single
// Many:1 → n:n
//   all changeTip options compatible
//   path: multiAspirate → single
// Many:1 → 1:many
//   changeTip: perSource → always
//   path: multiAspirate → single

describe('path should update...', () => {
  describe('if new volume exceeds pipette/tip capacity', () => {
    const multiPaths = ['multiAspirate', 'multiDispense']
    multiPaths.forEach(path => {
      test(`path ${path} → single`, () => {
        const patch = {path}
        const result = handleFormHelper(patch, {})
        expect(result).toEqual({path: 'single'})
      })
    })
  })
})

// TODO IMMEDIATELY: write these tests more programatically, less repeated boilerplate pattern
describe('path should update if new changeTip option is incompatible...', () => {
  const changeTipNoMultiPath = ['perSource', 'perDest']
  changeTipNoMultiPath.forEach(changeTip => {
    test(`"${changeTip}" selected: path → single`, () => {
      const patch = {changeTip}
      const result = handleFormHelper(patch, {})
      expect(result).toEqual({...patch, path: 'single'})
    })
  })
})

describe('fields should update in response to well selection change...', () => {
  describe('well selection changed to n:n', () => {
    const patch = {aspirate_wells: multiWells, dispense_wells: multiWells}
    test('changeTip: perDest → always', () => {
      const result = handleFormHelper(patch, {changeTip: 'perDest'})
      expect(result).toEqual({...patch, changeTip: 'always'})
    })
    test('path: multiAspirate → single', () => {
      const result = handleFormHelper(patch, {path: 'multiAspirate'})
      expect(result).toEqual({...patch, path: 'single'})
    })
  })

  describe('well selection changed to Many:1', () => {
    const patch = {aspirate_wells: multiWells, dispense_wells: singleWell}
    test('changeTip: perSource → always', () => {
      const result = handleFormHelper(patch, {changeTip: 'perSource'})
      expect(result).toEqual({...patch, changeTip: 'always'})
    })
    test('path: multiDispense → single', () => {
      const result = handleFormHelper(patch, {path: 'multiDispense'})
      expect(result).toEqual({...patch, path: 'single'})
    })
  })

  describe('well selection changed to 1:many', () => {
    const patch = {aspirate_wells: singleWell, dispense_wells: multiWells}
    test('changeTip: perSource → always', () => {
      const result = handleFormHelper(patch, {changeTip: 'perSource'})
      expect(result).toEqual({...patch, changeTip: 'always'})
    })
    test('path: multiAspirate → single', () => {
      const result = handleFormHelper(patch, {path: 'multiAspirate'})
      expect(result).toEqual({...patch, path: 'single'})
    })
  })
})

// const allValues = {
//   path: ['single', 'multiAspirate', 'multiDispense'],
//   changeTip: ['perSource', 'perDest', 'always', 'once', 'never'],
// }

// const perSourceDest = ['perSource', 'perDest']

// const testCases = [
//   {
//     prevKeyValue: 'n:n',
//     nextKeyValue: '1:many',
//     fields: [
//       {name: 'changeTip', prev: perSourceDest, next: 'always'},
//       {name: 'path', prev: allValues.path, next: allValues.path},
//     ],
//   },
//   {
//     prevKeyValue: 'n:n',
//     nextKeyValue: 'many:1',
//     fields: [
//       {name: 'changeTip', prev: allValues.changeTip, next: allValues.changeTip},
//       {name: 'path', prev: allValues.path, next: allValues.path},
//     ],
//   },
//   {
//     prevKeyValue: '1:many',
//     nextKeyValue: 'n:n',
//     fields: [
//       {name: 'changeTip', prev: perSourceDest, next: 'always'},
//       {name: 'path', prev: allValues.path, next: allValues.path},
//     ],
//   },
//   {
//     prevKeyValue: '1:many',
//     nextKeyValue: 'many:1',
//     fields: [
//       {name: 'changeTip', prev: perSourceDest, next: 'always'},
//       {name: 'path', prev: 'multiDispense', next: 'single'},
//     ],
//   },
//   {
//     prevKeyValue: 'many:1',
//     nextKeyValue: 'n:n',
//     fields: [
//       {name: 'changeTip', prev: allValues.changeTip, next: allValues.changeTip},
//       {name: 'path', prev: 'multiAspirate', next: 'single'},
//     ],
//   },
//   {
//     prevKeyValue: 'many:1',
//     nextKeyValue: '1:many',
//     fields: [
//       {name: 'changeTip', prev: 'perSource', next: 'always'},
//       {name: 'path', prev: 'multiAspirate', next: 'single'},
//     ],
//   },
// ]
