// @flow
import { combineEpics } from 'redux-observable'
import { filter, tap, ignoreElements } from 'rxjs/operators'
import { remote } from './remote'

import type { Epic, Action } from '../types'

const sendActionToShellEpic: Epic = action$ =>
  action$.pipe(
    filter<Action>(a => a.meta != null && a.meta.shell != null && a.meta.shell),
    tap<Action>((shellAction: Action) => remote.dispatch(shellAction)),
    ignoreElements()
  )

const receiveActionFromShellEpic: Epic = () => remote.inbox

export const shellEpic: Epic = combineEpics(
  sendActionToShellEpic,
  receiveActionFromShellEpic
)
