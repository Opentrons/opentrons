// @flow

import { getLabware } from '@opentrons/shared-data'
import zipWith from 'lodash/zipWith'
import reverse from 'lodash/reverse'
import uniq from 'lodash/uniq'
import compact from 'lodash/compact'
import flatten from 'lodash/flatten'
import intersection from 'lodash/intersection'
import type { FormData } from '../../../form-types'
import type { MixFormData } from '../../../step-generation'
import { DEFAULT_CHANGE_TIP_OPTION } from '../../../constants'
import type { WellOrderOption } from '../../../components/StepEditForm/WellOrderInput/WellOrderModal';
import type { StepFormContext } from './types'

type ValidationAndErrors<F> = {
  errors: {[string]: string},
  validatedForm: F | null
}

// TODO: grab the real one from WellOrder central location
const VERTICAL_OPTIONS = ['t2b', 'b2t']

const templateColsToRows = (template) => (
  zipWith(...template, (...col) => (compact(uniq(col))))
)

const orderWells = (
  wells: Array<string>,
  template: Array<Array<string>>,
  first: WellOrderOption,
  second: WellOrderOption
) => {
  let orderedWells = []
  if (VERTICAL_OPTIONS.includes(first)) {
    if (second === 'r2l') {
      orderedWells = reverse(template)
      if (first === 'b2t') orderedWells.map(col => reverse(col))
    } else {
      orderedWells = template
      if (first === 'b2t') orderedWells = template.map(col => reverse(col))
    }
  } else {
    const templateRows = templateColsToRows(template)
    if (second === 'b2t') {
      orderedWells = reverse(template)
      if (first === 'r2l') orderedWells.map(col => reverse(col))
    } else {
      orderedWells = templateRows
      if (first === 'r2l') orderedWells = template.map(col => reverse(col))
    }
  }
  console.table({ow: flatten(orderedWells), wells, i: intersection(flatten(orderedWells), wells)})
  return intersection(flatten(orderedWells), wells)
}

const mixFormToArgs = (formData: FormData, context: StepFormContext): ValidationAndErrors<MixFormData> => {
  const requiredFields = ['pipette', 'labware', 'volume', 'times']

  let errors = {}

  requiredFields.forEach(field => {
    if (formData[field] == null) {
      errors[field] = 'This field is required'
    }
  })

  const {labware, pipette} = formData
  const touchTip = !!formData['touchTip']

  const wells = formData.wells || []
  const orderFirst = formData.aspirate_wellOrder_first
  const orderSecond = formData.aspirate_wellOrder_second
  if (context && context.labware && labware) {
    const labwareById = context.labware
    const labwareType = labwareById[labware].type
    const labwareDef = getLabware(labwareType)
    const template = labwareDef.ordering
    const orderedWells = orderWells(wells, template, orderFirst, orderSecond)
    console.log(orderedWells)
  }

  const volume = Number(formData.volume) || 0
  const times = Number(formData.times) || 0

  // It's radiobutton, so one should always be selected.
  const changeTip = formData['aspirate_changeTip'] || DEFAULT_CHANGE_TIP_OPTION

  const blowout = formData['dispense_blowout_labware']

  const delay = formData['dispense_delay_checkbox']
    ? ((Number(formData['dispense_delayMinutes']) || 0) * 60) +
      (Number(formData['dispense_delaySeconds'] || 0))
    : null
  // TODO Ian 2018-05-08 delay number parsing errors

  if (wells.length <= 0) {
    errors.wells = '1 or more wells is required'
  }

  if (volume <= 0) {
    errors.volume = 'Volume must be a number greater than 0'
  }

  if (times <= 0 || !Number.isInteger(times)) {
    errors.times = 'Number of repetitions must be an integer greater than 0'
  }

  // TODO: BC 2018-08-21 remove this old validation logic, currently unused
  const isErrorFree = !Object.values(errors).length > 0

  return {
    errors,
    validatedForm: isErrorFree && labware && pipette
      ? {
        stepType: 'mix',
        name: `Mix ${formData.id}`, // TODO real name for steps
        description: 'description would be here 2018-03-01', // TODO get from form
        labware,
        wells,
        volume,
        times,
        touchTip,
        delay,
        changeTip,
        blowout,
        pipette
      }
      : null
  }
}

export default mixFormToArgs
