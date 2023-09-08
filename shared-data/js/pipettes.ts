import pipetteNameSpecs from '../pipette/definitions/1/pipetteNameSpecs.json'
import pipetteModelSpecs from '../pipette/definitions/1/pipetteModelSpecs.json'
import { OT3_PIPETTES } from './constants'

import type { PipetteNameSpecs, PipetteModelSpecs } from './types'

type SortableProps = 'maxVolume' | 'channels'

// TODO(mc, 2021-04-30): use these types, pulled directly from the JSON,
// to simplify return types in this module and possibly remove some `null`s
export type PipetteName = keyof typeof pipetteNameSpecs
export type PipetteModel = keyof typeof pipetteModelSpecs.config

// models sorted by channels and then volume by default
const ALL_PIPETTE_NAMES: PipetteName[] = (Object.keys(
  pipetteNameSpecs
) as PipetteName[]).sort(comparePipettes(['channels', 'maxVolume']))

// use a name like 'p10_single' to get specs true for all models under that name
export function getPipetteNameSpecs(
  name: PipetteName
): PipetteNameSpecs | null {
  const config = pipetteNameSpecs[name] as
    | Omit<PipetteNameSpecs, 'name'>
    | undefined
  return config != null ? { ...config, name } : null
}

// specify a model, eg 'p10_single_v1.3' to get
// both the name specs + model-specific specs
// NOTE: this should NEVER be used in PD, which is model-agnostic
export function getPipetteModelSpecs(
  model: PipetteModel
): PipetteModelSpecs | null | undefined {
  const modelSpecificFields = pipetteModelSpecs.config[model]
  const modelFields =
    modelSpecificFields &&
    getPipetteNameSpecs(modelSpecificFields.name as PipetteName)
  return modelFields && { ...modelFields, ...modelSpecificFields, model }
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
    getPipetteNameSpecs(pipetteName)?.displayCategory === 'FLEX'
  )
}

export const getIncompatiblePipetteNames = (
  currentPipette: PipetteName
): string[] => {
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
