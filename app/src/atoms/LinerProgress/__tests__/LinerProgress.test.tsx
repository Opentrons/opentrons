import React, * as Rect from 'react'
import { renderWithProviders, COLORS } from '@opentrons/components'

import { LinerProgress } from '..'

const render = (props: React.ComponentProps<typeof LinerProgress>) => {
  return renderWithProviders(<LinerProgress {...props} />)
}

describe('LinerProgress', () => {
  let props: React.ComponentProps<typeof LinerProgress>

  beforeEach(() => {
    props = {
      completed: 0,
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders LinerProgress Bar at 0% with', () => {
    const [{ getByTestId }] = render(props)
    const container = getByTestId('LinerProgress_Container')
    const bar = getByTestId('LinerProgress_Bar')
    expect(container).toHaveStyle(`background: ${COLORS.white}`)
    expect(bar).toHaveStyle('width: 0%')
  })

  it('renders LinerProgress Bar at 50% with', () => {
    props.completed = 50
    const [{ getByTestId }] = render(props)
    const bar = getByTestId('LinerProgress_Bar')
    expect(bar).toHaveStyle(`background: ${COLORS.blueEnabled}`)
    expect(bar).toHaveStyle('width: 50%')
  })

  it('renders LinerProgress Bar at 100% with', () => {
    props.completed = 100
    const [{ getByTestId }] = render(props)
    const bar = getByTestId('LinerProgress_Bar')
    expect(bar).toHaveStyle(`background: ${COLORS.blueEnabled}`)
    expect(bar).toHaveStyle('width: 100%')
  })

  it('renders LinerProgress Bar at 50% + red with', () => {
    props.completed = 50
    props.color = COLORS.errorEnabled
    const [{ getByTestId }] = render(props)
    const bar = getByTestId('LinerProgress_Bar')
    expect(bar).not.toHaveStyle(`background: ${COLORS.blueEnabled}`)
    expect(bar).toHaveStyle(`background: ${COLORS.errorEnabled}`)
    expect(bar).toHaveStyle('width: 50%')
  })
})
