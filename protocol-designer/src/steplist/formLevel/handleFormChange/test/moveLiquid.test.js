// @flow
import handleFormChangeMoveLiquid from '../handleFormChangeMoveLiquid'

// TODO IMMEDIATELY: set up in beforeEach (nested???)
const pipetteEntities = {}
const labwareEntities = {}
// const singleWell = ['A1']
// const multiWells = ['A2', 'A3']
const handleFormHelper = (patch, baseForm) => handleFormChangeMoveLiquid(
  patch, baseForm, pipetteEntities, labwareEntities
)

describe('path should update...', () => {
  describe.skip('if new volume exceeds pipette/tip capacity', () => { // TODO IMMEDIATELY
    const multiPaths = ['multiAspirate', 'multiDispense']
    multiPaths.forEach(path => {
      test(`path ${path} → single`, () => {
        const patch = {path}
        const result = handleFormHelper(patch, {})
        expect(result).toEqual({path: 'single'})
      })
    })
  })

  describe('if new changeTip option is incompatible...', () => {
    // [changeTip, incompatiblePath]
    const cases = [
      ['perSource', 'multiAspirate'],
      ['perDest', 'multiDispense'],
    ]
    cases.forEach(([changeTip, badPath]) => {
      test(`"${changeTip}" selected: path → single`, () => {
        const patch = {changeTip}
        const result = handleFormHelper({...patch, path: badPath}, {})
        expect(result).toEqual({...patch, path: 'single'})
      })
    })
  })
})

describe('fields should update in response to well selection change...', () => {
  // TODO IMMEDIATELY: some of these are wrong (expect update when they shouldn't)

  // describe('well selection changed to n:n', () => {
  //   const patch = {aspirate_wells: multiWells, dispense_wells: multiWells}
  //   test('changeTip: perDest → always', () => {
  //     const result = handleFormHelper(patch, {changeTip: 'perDest'})
  //     expect(result).toEqual({...patch, changeTip: 'always'})
  //   })
  //   test('path: multiAspirate → single', () => {
  //     const result = handleFormHelper(patch, {path: 'multiAspirate'})
  //     expect(result).toEqual({...patch, path: 'single'})
  //   })
  // })
  //
  // describe('well selection changed to Many:1', () => {
  //   const patch = {aspirate_wells: multiWells, dispense_wells: singleWell}
  //   test('changeTip: perSource → always', () => {
  //     const result = handleFormHelper(patch, {changeTip: 'perSource'})
  //     expect(result).toEqual({...patch, changeTip: 'always'})
  //   })
  //   test('path: multiDispense → single', () => {
  //     const result = handleFormHelper(patch, {path: 'multiDispense'})
  //     expect(result).toEqual({...patch, path: 'single'})
  //   })
  // })
  //
  // describe('well selection changed to 1:many', () => {
  //   const patch = {aspirate_wells: singleWell, dispense_wells: multiWells}
  //   test('changeTip: perSource → always', () => {
  //     const result = handleFormHelper(patch, {changeTip: 'perSource'})
  //     expect(result).toEqual({...patch, changeTip: 'always'})
  //   })
  //   test('path: multiAspirate → single', () => {
  //     const result = handleFormHelper(patch, {path: 'multiAspirate'})
  //     expect(result).toEqual({...patch, path: 'single'})
  //   })
  // })
})
