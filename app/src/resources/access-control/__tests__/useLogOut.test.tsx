import { Provider } from 'react-redux'
import { renderHook } from '@testing-library/react'
import { legacy_createStore } from 'redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getLocalRobot } from '/app/redux/discovery'
import { logOut } from '/app/redux/robot-auth'
import { useLogOut } from '/app/resources/access-control/useLogOut'

import type { Store } from 'redux'
import type { FunctionComponent, ReactNode } from 'react'
import type { State } from '/app/redux/types'

vi.mock('/app/redux/discovery', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...(actual as object),
    getLocalRobot: vi.fn(),
  }
})

vi.mock('/app/redux/robot-auth', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...(actual as object),
    getLocalRobotAuthState: vi.fn(),
  }
})

vi.mock('@opentrons/react-api-client', () => ({
  useSelfQuery: vi.fn(),
}))

const store: Store<State> = legacy_createStore(state => state, {} as State)

describe('useLogOut', () => {
  let wrapper: FunctionComponent<{ children: ReactNode }>

  beforeEach(() => {
    store.dispatch = vi.fn()
    wrapper = ({ children }) => <Provider store={store}>{children}</Provider>
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('dispatches logOutOrTimeOut when the local robot name is known', () => {
    vi.mocked(getLocalRobot).mockReturnValue({
      name: 'my-robot',
    } as ReturnType<typeof getLocalRobot>)

    const { result } = renderHook(() => useLogOut(), { wrapper })

    result.current()

    expect(store.dispatch).toHaveBeenCalledWith(
      logOut({ robotName: 'my-robot' })
    )
  })

  it('does not dispatch when the local robot cannot be resolved', () => {
    vi.mocked(getLocalRobot).mockReturnValue(null)

    const { result } = renderHook(() => useLogOut(), { wrapper })

    result.current()

    expect(store.dispatch).not.toHaveBeenCalled()
  })
})
