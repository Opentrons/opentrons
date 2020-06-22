// mock remote object
import { Subject } from 'rxjs'

import type { Action } from '../../types'
import type { Remote } from '../types'

const dispatch = jest.fn()
const log = jest.fn()
const inbox = new Subject<Action>()

export const remote: Remote = { dispatch, log, inbox }
