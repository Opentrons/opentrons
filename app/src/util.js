// @flow
// utility functions
import groupBy from 'lodash/groupBy'
import type { Action, ThunkAction, ThunkPromiseAction } from './types'
import createLogger from './logger'

type Chainable = Action | ThunkAction | ThunkPromiseAction

type ChainAction = Promise<?Action>

const log = createLogger(__filename)

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// dispatch a chain of actions or thunk actions until an error occurs
// error means: error in action, error in payload, or promise rejection
// TODO(mc, 2018-06-11): This is a little too bespoke for my tastes. Explore
//   npm for available ecosystem solutions soon
export function chainActions(...actions: Array<Chainable>): ThunkPromiseAction {
  let i = 0
  let result: ?Action = null

  return dispatch => {
    return next()

    function next(): ChainAction {
      const current = actions[i]

      if (!current) return resolveResult()

      i++
      // TODO(mc, 2018-06-11): Should we debounce plain actions with RAF?
      result = dispatch(current)
      if (result && result.then) return result.then(handleAction, handleError)
      return handleAction(result)
    }

    function handleAction(action: ?Action): ChainAction {
      if (
        action &&
        // $FlowFixMe: Flow complains about accessing `error` on payload
        (action.error || (action.payload && action.payload.error))
      ) {
        log.debug('Early return from action chain', { action })
        return resolveResult()
      }

      return next()
    }

    function handleError(error): ChainAction {
      log.error('ThunkPromiseAction in chain rejected', { error })
      result = null
      return resolveResult()
    }

    function resolveResult(): ChainAction {
      return Promise.resolve(result)
    }
  }
}

// require all definitions in the labware/definitions/2 directory
// require.context is webpack-specific method
const definitionsContext = (require: any).context(
  '@opentrons/shared-data/labware/definitions/2',
  true, // traverse subdirectories
  /\.json$/, // import filter
  'sync' // load every definition into one synchronous chunk
)

let definitions: LabwareList | null = null

export function getLatestDefinitions(): LabwareList {
  // NOTE: unlike labware-library, no filtering out "do not list labware"
  // also, more convenient & performant to make a map {loadName: def} not an array
  if (!definitions) {
    const allDefs = definitionsContext
      .keys()
      .map(name => definitionsContext(name))
    // group by namespace + loadName
    const labwareDefGroups: {
      [groupKey: string]: Array<LabwareDefinition2>,
    } = groupBy(allDefs, d => `${d.namespace}/${d.parameters.loadName}`)

    definitions = Object.keys(labwareDefGroups).map((groupKey: string) => {
      const group = labwareDefGroups[groupKey]
      const allVersions = group.map(d => d.version)
      const highestVersionNum = Math.max(...allVersions)
      const resultIdx = group.findIndex(d => d.version === highestVersionNum)
      return group[resultIdx]
    })
  }

  return definitions
}

export function getLatestLabwareDef(
  loadName: ?string
): LabwareDefinition | null {
  const def = getLatestDefinitions().find(
    d => d.parameters.loadName === loadName
  )
  return def || null
}
