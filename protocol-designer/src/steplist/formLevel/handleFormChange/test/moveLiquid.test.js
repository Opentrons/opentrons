// @flow
import handleFormChangeMoveLiquid from '../handleFormChangeMoveLiquid'

let pipetteEntities
let labwareEntities
let handleFormHelper

beforeEach(() => {
  pipetteEntities = {pipetteId: {name: 'p10_single', tiprackModel: 'tiprack-10ul'}}
  labwareEntities = {}
  handleFormHelper = (patch, baseForm) => handleFormChangeMoveLiquid(
    patch, baseForm, pipetteEntities, labwareEntities
  )
})

describe('path should update...', () => {
  describe('if path is multi and volume exceeds pipette/tip capacity', () => {
    const multiPaths = ['multiAspirate', 'multiDispense']
    multiPaths.forEach(path => {
      test(`path ${path} → single`, () => {
        // volume is updated, existing path was multi
        const result = handleFormHelper({volume: 9999}, {pipette: 'pipetteId', path})
        expect(result).toEqual({path: 'single', volume: 9999})
        // path is updated, existing volume exceeds capacity
        const result2 = handleFormHelper({path}, {pipette: 'pipetteId', volume: 9999})
        expect(result2).toEqual({path: 'single'})
      })
    })
  })

  describe('if new changeTip option is incompatible...', () => {
    // cases are: [changeTip, pathThatIsIncompatibleWithChangeTip]
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
