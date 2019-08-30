// @flow
import pipetteNameSpecs from '../pipette/definitions/pipetteNameSpecs.json'
import pipetteModelSpecs from '../pipette/definitions/pipetteModelSpecs.json'

export type PipetteChannels = 1 | 8
export type PipetteDisplayCategory = 'OG' | 'GEN2'

export type PipetteNameSpecs = {
  name: string,
  displayName: string,
  displayCategory?: PipetteDisplayCategory,
  minVolume: number,
  maxVolume: number,
  defaultAspirateFlowRate: { value: number },
  defaultDispenseFlowRate: { value: number },
  channels: PipetteChannels,
}

export type PipetteModelSpecs = {
  model: string,
  tipLength: { value: number },
} & PipetteNameSpecs

type SortableProps = 'maxVolume' | 'channels' | 'displayCategory'

// displayCategories sorted by newest to oldest
export const ALL_PIPETTE_CATEGORIES: Array<PipetteDisplayCategory> = [
  'GEN2',
  'OG',
]

// models sorted by channels and then volume by default
const ALL_PIPETTE_NAMES: Array<string> = Object.keys(pipetteNameSpecs).sort(
  comparePipettes(['channels', 'maxVolume'])
)

// use a name like 'p10_single' to get specs true for all models under that name
export function getPipetteNameSpecs(name: string): ?PipetteNameSpecs {
  const config = pipetteNameSpecs[name]
  return config && { ...config, name }
}

// specify a model, eg 'p10_single_v1.3' to get
// both the name specs + model-specific specs
// NOTE: this should NEVER be used in PD, which is model-agnostic
export function getPipetteModelSpecs(model: string): ?PipetteModelSpecs {
  const modelSpecificFields = pipetteModelSpecs.config[model]
  const modelFields =
    modelSpecificFields && getPipetteNameSpecs(modelSpecificFields.name)
  return modelFields && { ...modelFields, ...modelSpecificFields }
}

export function getAllPipetteNames(
  ...sortBy: Array<SortableProps>
): Array<string> {
  const models = [...ALL_PIPETTE_NAMES]

  if (sortBy.length) models.sort(comparePipettes(sortBy))

  return models
}

function comparePipettes(sortBy: Array<SortableProps>) {
  return (modelA, modelB) => {
    // any cast is because we know these pipettes exist
    const a: PipetteNameSpecs = (getPipetteNameSpecs(modelA): any)
    const b: PipetteNameSpecs = (getPipetteNameSpecs(modelB): any)

    let i
    for (i = 0; i < sortBy.length; i++) {
      const sortKey = sortBy[i]
      if (a[sortKey] < b[sortKey]) return -1
      if (a[sortKey] > b[sortKey]) return 1
    }

    return 0
  }
}
