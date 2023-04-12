import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { RunningProtocolSkeleton } from '../RunningProtocolSkeleton'

const render = (
  props: React.ComponentProps<typeof RunningProtocolSkeleton>
) => {
  return renderWithProviders(<RunningProtocolSkeleton {...props} />)
}

describe('RunningProtocolSkeleton', () => {
  let props: React.ComponentProps<typeof RunningProtocolSkeleton>

  beforeEach(() => {
    props = {
      currentOption: 'CurrentRunningProtocolCommand',
    }
  })

  it('renders Skeletons when current option is CurrentRunningProtocolCommand', () => {
    const [{ getAllByTestId, getAllByRole }] = render(props)
    const skeletons = getAllByTestId('Skeleton')
    const buttons = getAllByRole('button')
    expect(buttons.length).toBe(2)
    // Note Skeleton component checks width and height so here just check the number of skeletons and background-size
    expect(skeletons.length).toBe(4)
    expect(skeletons[0]).toHaveStyle('animation: shimmer 2s infinite linear')
    expect(skeletons[0]).toHaveStyle(`background-size: 99rem`)
  })

  it('renders Skeletons when current option is RunningProtocolCommandList', () => {
    props = { currentOption: 'RunningProtocolCommandList' }
    const [{ getAllByTestId, getAllByRole }] = render(props)
    const skeletons = getAllByTestId('Skeleton')
    const buttons = getAllByRole('button')
    expect(buttons.length).toBe(2)
    expect(skeletons.length).toBe(8)
    expect(skeletons[0]).toHaveStyle('animation: shimmer 2s infinite linear')
    expect(skeletons[0]).toHaveStyle(`background-size: 389rem`)
  })
})
