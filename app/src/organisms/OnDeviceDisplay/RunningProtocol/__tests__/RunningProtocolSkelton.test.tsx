import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { RunningProtocolSkelton } from '../RunningProtocolSkelton'

const render = (props: React.ComponentProps<typeof RunningProtocolSkelton>) => {
  return renderWithProviders(<RunningProtocolSkelton {...props} />)
}

describe('RunningProtocolSkelton', () => {
  let props: React.ComponentProps<typeof RunningProtocolSkelton>

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
    // Note Skelton component checks width and height so here just check the number of skeltons and background-size
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
