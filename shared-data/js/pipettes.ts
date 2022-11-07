import _pipetteNameSpecs from '../pipette/definitions/pipetteNameSpecs.json'
import _pipetteModelSpecs from '../pipette/definitions/pipetteModelSpecs.json'
import { OT3_PIPETTES } from './constants'

import type { PipetteNameSpecs, PipetteModelSpecs } from './types'

type SortableProps = 'maxVolume' | 'channels'

interface ModelSpecsFile {
  config: { [model: string]: Omit<PipetteModelSpecs, keyof PipetteNameSpecs> }
  mutableConfigs: Array<keyof PipetteModelSpecs>
  validQuirks: Array<keyof PipetteModelSpecs['quirks']>
}
interface NameSpecsFile {
  [name: string]: Omit<PipetteNameSpecs, 'name'>
}

const pipetteModelSpecs = _pipetteModelSpecs as ModelSpecsFile
const pipetteNameSpecs = _pipetteNameSpecs as NameSpecsFile

// TODO(mc, 2021-04-30): use these types, pulled directly from the JSON,
// to simplify return types in this module and possibly remove some `null`s
export type PipetteName = keyof typeof _pipetteNameSpecs
export type PipetteModel = keyof typeof _pipetteModelSpecs.config



// models sorted by channels and then volume by default
const ALL_PIPETTE_NAMES: PipetteName[] = (Object.keys(
  pipetteNameSpecs
) as PipetteName[]).sort(comparePipettes(['channels', 'maxVolume']))

// use a name like 'p10_single' to get specs true for all models under that name
export function getPipetteNameSpecs(
  name: PipetteName
): PipetteNameSpecs & {name: PipetteName} {
  const config = pipetteNameSpecs[name]
  return { ...config, name }
}

// specify a model, eg 'p10_single_v1.3' to get
// both the name specs + model-specific specs
// NOTE: this should NEVER be used in PD, which is model-agnostic
export function getPipetteModelSpecs(
  model: PipetteModel
): PipetteModelSpecs & PipetteNameSpecs {
  const modelSpecificFields = pipetteModelSpecs.config[model]
  const nameFields = getPipetteNameSpecs(modelSpecificFields.name)
  return { ...nameFields, ...modelSpecificFields }
}

export function getAllPipetteNames(...sortBy: SortableProps[]): PipetteName[] {
  const models = [...ALL_PIPETTE_NAMES]
  if (sortBy.length) models.sort(comparePipettes(sortBy))
  return models
}

function comparePipettes(sortBy: SortableProps[]) {
  return (modelA: PipetteName, modelB: PipetteName) => {
    // any cast is because we know these pipettes exist
    const a = getPipetteNameSpecs(modelA) as PipetteNameSpecs
    const b = getPipetteNameSpecs(modelB) as PipetteNameSpecs
    let i

    for (i = 0; i < sortBy.length; i++) {
      const sortKey = sortBy[i]
      if (a[sortKey] < b[sortKey]) return -1
      if (a[sortKey] > b[sortKey]) return 1
    }

    return 0
  }
}

export function shouldLevel(specs: PipetteNameSpecs): boolean {
  return specs.displayCategory === 'GEN2' && specs.channels === 8
}

export function isOT3Pipette(pipetteName: PipetteName): boolean {
  return (
    OT3_PIPETTES.includes(pipetteName) ||
    getPipetteNameSpecs(pipetteName)?.displayCategory === 'GEN3'
  )
}

export const getIncompatiblePipetteNames = (
  currentPipette: PipetteName
): PipetteName[] => {
  if (isOT3Pipette(currentPipette)) {
    return getAllPipetteNames().filter(pipette => !isOT3Pipette(pipette))
  } else if (
    getPipetteNameSpecs(currentPipette)?.displayCategory === 'GEN1' ||
    getPipetteNameSpecs(currentPipette)?.displayCategory === 'GEN2'
  ) {
    return getAllPipetteNames().filter(pipette => isOT3Pipette(pipette))
  } else {
    return []
  }
}
