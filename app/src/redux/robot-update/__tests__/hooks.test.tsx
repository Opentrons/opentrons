import { I18nextProvider } from 'react-i18next'
import { Provider } from 'react-redux'
import { renderHook } from '@testing-library/react'
import { legacy_createStore } from 'redux'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { i18n } from '/app/i18n'

import { clearRobotUpdateSession, startRobotUpdate } from '../actions'
import { useDispatchStartRobotUpdate } from '../hooks'

import type { Store } from 'redux'
import type { FunctionComponent, ReactNode } from 'react'
import type { State } from '../../types'

describe('useDispatchStartRobotUpdate', () => {
  let wrapper: FunctionComponent<{ children: ReactNode }>
  let store: Store<State>
  const mockRobotName = 'robotName'
  const mockSystemFile = 'systemFile'
  beforeEach(() => {
    store = legacy_createStore(vi.fn(), {})
    store.dispatch = vi.fn()
    wrapper = ({ children }) => (
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>{children}</Provider>
      </I18nextProvider>
    )
  })

  it('clears the robot update session before dispatching a new session with the given robotName and systemFile', () => {
    const { result } = renderHook(useDispatchStartRobotUpdate, {
      wrapper,
    })

    result.current(mockRobotName, mockSystemFile)
    expect(store.dispatch).toHaveBeenCalledWith(clearRobotUpdateSession())
    expect(store.dispatch).toHaveBeenCalledWith(
      startRobotUpdate(mockRobotName, mockSystemFile)
    )
  })
})
