// @flow
// mock remote object
import EventEmitter from 'events'
import { fromEvent } from 'rxjs'
import type { Remote } from '../types'

const _inboxBacker = new EventEmitter()

const dispatch = jest.fn()
const log = jest.fn()
const inbox = fromEvent(_inboxBacker, 'dispatch')
const __triggerAction = action => _inboxBacker.emit('dispatch', action)

export const remote: { ...Remote } = { dispatch, log, inbox, __triggerAction }
