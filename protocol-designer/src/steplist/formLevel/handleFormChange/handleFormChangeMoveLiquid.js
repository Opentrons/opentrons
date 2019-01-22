// @flow
import makeFieldUpdater from './makeFieldUpdater'
import type {FormData} from '../../../form-types'
import type {FormPatch} from '../../actions/types'
import type {LabwareEntities, PipetteEntities} from '../../../step-forms/types'

type WellRatio = 'n:n' | '1:many' | 'many:1' // TODO IMMEDIATELY import from somewhere more general

// type WellRatioUpdate = {
//   prevKeyValue: WellRatio,
//   nextKeyValue: WellRatio,
//   fields: Array<{name: string, prev: string, next: string}>,
// }

const wellRatioUpdatesMap = [
  {
    prevKeyValue: 'n:n',
    nextKeyValue: '1:many',
    fields: [
      {name: 'changeTip', prev: 'perSource', next: 'always'},
      {name: 'changeTip', prev: 'perDest', next: 'always'},
    ],
  },
  {
    prevKeyValue: 'n:n',
    nextKeyValue: 'many:1',
    fields: [
      // no updates, all possible values are OK
    ],
  },
  {
    prevKeyValue: '1:many',
    nextKeyValue: 'n:n',
    fields: [
      {name: 'changeTip', prev: 'perSource', next: 'always'},
      {name: 'changeTip', prev: 'perDest', next: 'always'},
    ],
  },
  {
    prevKeyValue: '1:many',
    nextKeyValue: 'many:1',
    fields: [
      {name: 'changeTip', prev: 'perSource', next: 'always'},
      {name: 'changeTip', prev: 'perDest', next: 'always'},
      {name: 'path', prev: 'multiDispense', next: 'single'},
    ],
  },
  {
    prevKeyValue: 'many:1',
    nextKeyValue: 'n:n',
    fields: [
      {name: 'path', prev: 'multiAspirate', next: 'single'},
    ],
  },
  {
    prevKeyValue: 'many:1',
    nextKeyValue: '1:many',
    fields: [
      {name: 'changeTip', prev: 'perSource', next: 'always'},
      {name: 'path', prev: 'multiAspirate', next: 'single'},
    ],
  },
]
const wellRatioUpdater = makeFieldUpdater(wellRatioUpdatesMap)

function getWellRatio (sourceWells: ?Array<string>, destWells: ?Array<string>): ?WellRatio {
  if (!sourceWells || !sourceWells.length || !destWells || !destWells.length) {
    return null
  }
  if (sourceWells.length === destWells.length) {
    return 'n:n'
  }
  if (sourceWells.length === 1 && destWells.length > 1) {
    return '1:many'
  }
  if (sourceWells.length > 1 && destWells.length === 1) {
    return 'many:1'
  }
  console.assert(false, `unexpected well ratio: ${sourceWells.length}:${destWells.length}`)
  return null
}

export default function handleFormChangeMoveLiquid (
  patch: FormPatch,
  baseForm: ?FormData,
  pipetteEntities: PipetteEntities,
  labwareEntities: LabwareEntities
): FormPatch {
  const naivePatchedForm = {...baseForm, ...patch}
  const prevWellRatio = baseForm ? getWellRatio(baseForm.aspirate_wells, baseForm.dispense_wells) : null
  const nextWellRatio = getWellRatio(naivePatchedForm.aspirate_wells, naivePatchedForm.dispense_wells)
  return {
    ...patch,
    ...(prevWellRatio && nextWellRatio)
      ? wellRatioUpdater(prevWellRatio, nextWellRatio, patch)
      : {},
  }
}
