// analytics module
// pushes events to GTM's data layer
import gtmConfig from './gtm-config'
import makeEvent from './make-event'

// grab the data layer (and create it if it doesn't exist)
const {DATA_LAYER_NAME} = gtmConfig
const dataLayer = global[DATA_LAYER_NAME] = global[DATA_LAYER_NAME] || []

export const NAME = 'analytics'

const CUSTOM_EVENT_NAME = 'OT_EVENT'
const INITIAL_STATE = {}

export function reducer (state = INITIAL_STATE, action) {
  return state
}

export function tagAction (action) {
  const meta = action.meta || {}

  return {...action, meta: {...meta, [NAME]: true}}
}

export const middleware = (store) => (next) => (action) => {
  const meta = action.meta && action.meta[NAME]

  if (meta) {
    const {type} = action
    const event = makeEvent(store.getState(), action)

    if (event) {
      dataLayer.push({
        event: CUSTOM_EVENT_NAME,
        action: event.name,
        category: event.category,
        label: mapPayloadToLabel(event.payload)
      })
    } else {
      // TODO(mc, 2017-11-20): use a proper logger rather than console
      console.warn(`Warning: no analytics mapper found for action ${type}`)
    }
  }

  next(action)
}

// maps a payload object to an analytics label string
function mapPayloadToLabel (payload) {
  if (payload == null) return ''
  if (typeof payload !== 'object') return payload

  return Object.keys(payload).map((key) => {
    return `${key}=${payload[key]}`
  }).join(',')
}
