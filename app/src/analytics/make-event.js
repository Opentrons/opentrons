// @flow
// redux action types to analytics events map
import type {State, Action} from '../types'

type Category =
  | 'robot'

type Event = {
  name: string,
  category: Category,
  payload: {}
}

export default function makeEvent (state: State, action: Action): ?Event {
  switch (action.type) {
    case 'robot:CONNECT_RESPONSE':
      return {name: 'connect', category: 'robot', payload: {}}
  }

  return null
}
