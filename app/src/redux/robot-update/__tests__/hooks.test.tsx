import { Provider } from 'react-redux'
import { renderHook } from '@testing-library/react'
import { legacy_createStore } from 'redux'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RobotUpdateContext } from '/app/resources/robot-update/RobotUpdateContext'

import { useDispatchStartRobotUpdate } from '../hooks'

import type { Store } from 'redux'
import type { FunctionComponent, ReactNode } from 'react'
import type { State } from '../../types'

describe('useDispatchStartRobotUpdate', () => {
  let wrapper: FunctionComponent<{ children: ReactNode }>
  let store: Store<State>
  const mockRobotName = 'robotName'
  const mockSystemFile = 'systemFile'
  const startUpdate = vi.fn()

  beforeEach(() => {
    startUpdate.mockClear()
    store = legacy_createStore(vi.fn(), {})
    store.dispatch = vi.fn()
    wrapper = ({ children }) => (
      <Provider store={store}>
        <RobotUpdateContext.Provider value={{ startUpdate }}>
          {children}
        </RobotUpdateContext.Provider>
      </Provider>
    )
  })

  it('delegates to RobotUpdateContext.startUpdate', () => {
    const { result } = renderHook(useDispatchStartRobotUpdate, {
      wrapper,
    })

    result.current(mockRobotName, mockSystemFile)
    expect(startUpdate).toHaveBeenCalledWith(mockRobotName, mockSystemFile)
  })
})
