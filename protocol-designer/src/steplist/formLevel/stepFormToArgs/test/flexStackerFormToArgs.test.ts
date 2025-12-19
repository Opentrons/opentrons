import { beforeEach, describe, expect, it } from 'vitest'

import { flexStackerFormToArgs } from '../flexStackerFormToArgs'

import type {
  FlexStackerFormType,
  HydratedFlexStackerFormData,
} from '/protocol-designer/form-types'
import type { GetCastFormData } from '/protocol-designer/steplist/fieldLevel'

describe('flexStackerFormToArgs', () => {
  let baseFormData: GetCastFormData<HydratedFlexStackerFormData>
  beforeEach(() => {
    baseFormData = {
      stepType: 'flexStacker',
      id: 'stacker-id',
      fillLabwareUri: null,
      fillQuantity: null,
      flexStackerFormType: null,
      interventionMessage: null,
      moduleId: 'moduleId',
      stepName: 'step name',
      stepDetails: 'stacker fill step',
      stepNumber: 1,
    }
  })
  it('returns flex stacker empty command creator', () => {
    const formData = {
      ...baseFormData,
      flexStackerFormType: 'empty' as FlexStackerFormType,
      interventionMessage: 'empty message',
    }
    const expected = {
      moduleId: 'moduleId',
      commandCreatorFnName: 'flexStackerEmpty',
      interventionMessage: 'empty message',
    }
    expect(flexStackerFormToArgs(formData)).toEqual(expected)
  })
  it('returns flex stacker fill command creator', () => {
    const formData = {
      ...baseFormData,
      flexStackerFormType: 'fill' as FlexStackerFormType,
      fillLabwareUri: 'labware',
      fillQuantity: 1,
      interventionMessage: 'fill message',
    }
    const expected = {
      moduleId: 'moduleId',
      commandCreatorFnName: 'flexStackerFillItems',
      fillLabwareUri: 'labware',
      fillQuantity: 1,
      interventionMessage: 'fill message',
    }
    expect(flexStackerFormToArgs(formData)).toEqual(expected)
  })
  it('returns flex stacker retrieve command creator', () => {
    const formData = {
      ...baseFormData,
      flexStackerFormType: 'retrieve' as FlexStackerFormType,
    }
    const expected = {
      moduleId: 'moduleId',
      commandCreatorFnName: 'flexStackerRetrieve',
    }
    expect(flexStackerFormToArgs(formData)).toEqual(expected)
  })
  it('returns flex stacker store command creator', () => {
    const formData = {
      ...baseFormData,
      flexStackerFormType: 'store' as FlexStackerFormType,
    }
    const expected = {
      moduleId: 'moduleId',
      commandCreatorFnName: 'flexStackerStore',
    }
    expect(flexStackerFormToArgs(formData)).toEqual(expected)
  })
})
