// @flow
import dependentFieldsUpdateMoveLiquid from '../dependentFieldsUpdateMoveLiquid'

let pipetteEntities
let labwareEntities
let handleFormHelper

beforeEach(() => {
  pipetteEntities = {pipetteId: {name: 'p10_single', tiprackModel: 'tiprack-10ul'}}
  labwareEntities = {}
  handleFormHelper = (patch, baseForm) => dependentFieldsUpdateMoveLiquid(
    patch, baseForm, pipetteEntities, labwareEntities
  )
})

describe('no-op cases should pass through the patch unchanged (same identity)', () => {
  test('empty patch', () => {
    const patch = {}
    expect(handleFormHelper(patch, {blah: 'blaaah'})).toBe(patch)
  })
  test('patch with unhandled field', () => {
    const patch = {fooField: 123}
    expect(handleFormHelper(patch, {blah: 'blaaah'})).toBe(patch)
  })
})

describe('path should update...', () => {
  describe('if path is multi and volume*2 exceeds pipette/tip capacity', () => {
    const multiPaths = ['multiAspirate', 'multiDispense']
    multiPaths.forEach(path => {
      test(`path ${path} → single`, () => {
        // volume is updated, existing path was multi
        // NOTE: 6 exceeds multi-well capacity of P10 (cannot fit 2 wells)
        const result2 = handleFormHelper(
          {volume: '6'},
          {
            path,
            volume: '1',
            pipette: 'pipetteId',
          })
        expect(result2).toMatchObject({path: 'single', volume: '6'})
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
        expect(result.path).toEqual('single')
      })
    })
  })
})

describe('disposal volume should update...', () => {
  let form
  beforeEach(() => {
    form = {
      path: 'multiDispense',
      volume: '2',
      pipette: 'pipetteId',
      disposalVolume_checkbox: true,
      disposalVolume_volume: '1.1',
    }
  })

  describe('should not remove valid decimal', () => {
    const testCases = ['.', '0.', '.1', '1.', '']
    testCases.forEach(disposalVolume_volume => {
      test(`input is ${disposalVolume_volume}`, () => {
        const result = handleFormHelper({disposalVolume_volume}, form)
        expect(result.disposalVolume_volume).toBe(disposalVolume_volume)
      })
    })
  })

  test('when path is changed: multiDispense → single', () => {
    const result = handleFormHelper({path: 'single'}, form)
    expect(result).toEqual({
      path: 'single',
      disposalVolume_checkbox: false,
      disposalVolume_volume: null})
  })

  test('when volume is raised but disposal vol is still in capacity, do not change (noop case)', () => {
    const patch = {volume: '2.5'}
    const result = handleFormHelper(patch, form)
    expect(result).toEqual(patch)
  })

  describe('when volume is raised so that disposal vol must be exactly zero, clear/zero disposal volume fields', () => {
    const volume = '5' // 5 + 5 = 10 which is P10 capacity ==> max disposal volume is zero
    test('when form is newly changed to multiDispense: clear the fields', () => {
      const patch = {path: 'multiDispense'}
      const result = handleFormHelper(patch, {...form, path: 'single', volume})
      expect(result).toEqual({
        ...patch,
        disposalVolume_volume: null,
        disposalVolume_checkbox: false,
      })
    })

    test('when form was multiDispense already: set to zero', () => {
      const patch = {volume}
      const result = handleFormHelper(patch, form)
      expect(result).toEqual({
        ...patch,
        disposalVolume_volume: '0',
      })
    })
  })

  test('when volume is raised past disposal volume, lower disposal volume', () => {
    const result = handleFormHelper({volume: '4.6'}, form)
    expect(result).toEqual({
      volume: '4.6', disposalVolume_volume: '0.8'})
  })

  test('clamp excessive disposal volume to max', () => {
    const result = handleFormHelper({disposalVolume_volume: '9999'}, form)
    expect(result).toEqual({disposalVolume_volume: '6'})
  })

  test('when disposal volume is a negative number, set to zero', () => {
    const result = handleFormHelper({disposalVolume_volume: '-2'}, form)
    expect(result).toEqual({disposalVolume_volume: '0'})
  })
})
