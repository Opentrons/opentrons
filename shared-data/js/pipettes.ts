import pipetteNameSpecs from '../pipette/definitions/pipetteNameSpecs.json'
import pipetteModelSpecs from '../pipette/definitions/pipetteModelSpecs.json'

import type { PipetteNameSpecs, PipetteModelSpecs } from './types'

type SortableProps = 'maxVolume' | 'channels'

// models sorted by channels and then volume by default
const ALL_PIPETTE_NAMES: string[] = Object.keys(pipetteNameSpecs).sort(
  comparePipettes(['channels', 'maxVolume'])
)
// use a name like 'p10_single' to get specs true for all models under that name
export function getPipetteNameSpecs(name: string): PipetteNameSpecs | null {
  // @ts-expect-error(mc, 2021-04-27): use "safer" accessor to make TS happy
  const config = pipetteNameSpecs[name]
  return config != null ? { ...config, name } : null
}

// specify a model, eg 'p10_single_v1.3' to get
// both the name specs + model-specific specs
// NOTE: this should NEVER be used in PD, which is model-agnostic
export function getPipetteModelSpecs(
  model: string
): PipetteModelSpecs | null | undefined {
  // @ts-expect-error(mc, 2021-04-27): use "safer" accessor to make TS happy
  const modelSpecificFields = pipetteModelSpecs.config[model]
  const modelFields =
    modelSpecificFields && getPipetteNameSpecs(modelSpecificFields.name)
  return modelFields && { ...modelFields, ...modelSpecificFields, model }
}

export function getAllPipetteNames(...sortBy: SortableProps[]): string[] {
  const models = [...ALL_PIPETTE_NAMES]
  if (sortBy.length) models.sort(comparePipettes(sortBy))
  return models
}

function comparePipettes(sortBy: SortableProps[]) {
  return (modelA: string, modelB: string) => {
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
