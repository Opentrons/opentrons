// @flow
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import fixture_trash from '@opentrons/shared-data/labware/fixtures/2/fixture_trash.json'
import dependentFieldsUpdateMix from '../dependentFieldsUpdateMix'
import { DEFAULT_MM_FROM_BOTTOM_DISPENSE } from '../../../../constants'

let pipetteEntities
let labwareEntities
let handleFormHelper

beforeEach(() => {
  pipetteEntities = {
    pipetteId: {
      name: 'p10_single',
      tiprackModel: 'tiprack-10ul',
      spec: { channels: 1 },
    },
    pipetteMultiId: {
      name: 'p10_multi',
      tiprackModel: 'tiprack-10ul',
      spec: { channels: 8 },
    },
  }
  labwareEntities = {
    trashId: { type: 'trash-box', def: fixture_trash },
    plateId: { type: '96-flat', def: fixture_96_plate },
  }
  handleFormHelper = (patch, baseForm) =>
    dependentFieldsUpdateMix(patch, baseForm, pipetteEntities, labwareEntities)
})

describe('no-op cases should pass through the patch unchanged', () => {
  const minimalBaseForm = {
    blah: 'blaaah',
  }

  test('empty patch', () => {
    const patch = {}
    expect(handleFormHelper(patch, minimalBaseForm)).toBe(patch)
  })
  test('patch with unhandled field', () => {
    const patch = { fooField: 123 }
    expect(handleFormHelper(patch, minimalBaseForm)).toBe(patch)
  })
})

describe('well selection should update', () => {
  let form
  beforeEach(() => {
    form = {
      labware: 'plateId',
      wells: ['A1', 'B1'],
      volume: '2',
      pipette: 'pipetteId',
    }
  })

  test('pipette cleared', () => {
    const patch = { pipette: null }
    expect(handleFormHelper(patch, form)).toEqual({ ...patch, wells: [] })
  })

  test('pipette single -> multi', () => {
    const patch = { pipette: 'pipetteMultiId' }
    expect(handleFormHelper(patch, form)).toEqual({ ...patch, wells: [] })
  })

  test('pipette multi -> single', () => {
    const multiChForm = {
      ...form,
      pipette: 'pipetteMultiId',
      wells: ['A10'],
    }
    const patch = { pipette: 'pipetteId' }
    expect(handleFormHelper(patch, multiChForm)).toEqual({
      ...patch,
      wells: ['A10', 'B10', 'C10', 'D10', 'E10', 'F10', 'G10', 'H10'],
    })
  })

  test('select single-well labware', () => {
    const patch = { labware: 'trashId' }
    expect(handleFormHelper(patch, form)).toEqual({
      ...patch,
      wells: ['A1'],
      mix_mmFromBottom: DEFAULT_MM_FROM_BOTTOM_DISPENSE,
    })
  })

  test('select labware with multiple wells', () => {
    const trashLabwareForm = { ...form, labware: 'trashId' }
    const patch = { labware: 'plateId' }
    expect(handleFormHelper(patch, trashLabwareForm)).toEqual({
      ...patch,
      wells: [],
      mix_mmFromBottom: DEFAULT_MM_FROM_BOTTOM_DISPENSE,
    })
  })
})
