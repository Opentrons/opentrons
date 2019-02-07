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
        console.log('test path', path)
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
    expect(result).toEqual({
      volume: '2.5',
      disposalVolume_volume: form.disposalVolume_volume})
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

  test('when disposal volume is not > zero, clear the disposal volume fields', () => {
    const expected = {disposalVolume_volume: null, disposalVolume_checkbox: false}
    const testCases = ['-999', '0', '', null]
    testCases.forEach(dispVol => {
      expect(
        handleFormHelper({disposalVolume_volume: dispVol}, form)
      ).toEqual(expected)
    })
  })
})
