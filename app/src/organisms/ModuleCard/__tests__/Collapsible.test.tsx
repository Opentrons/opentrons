import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { Collapsible } from '../Collapsible'

const render = (props: React.ComponentProps<typeof Collapsible>) => {
  return renderWithProviders(<Collapsible {...props} />)[0]
}

describe('Collapsible', () => {
  let props: React.ComponentProps<typeof Collapsible>
  beforeEach(() => {
    props = {
      expanded: false,
      title: 'title',
      toggleExpanded: jest.fn(),
      children: <div>children</div>,
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders collapsible with default icons and not expanded', () => {
    const { getByRole, getByText } = render(props)
    fireEvent.click(getByRole('heading', { name: 'title' }))
    expect(props.toggleExpanded).toHaveBeenCalled()
    getByText('children')
  })
  it('renders collapsible with default icon and expanded', () => {
    props = {
      expanded: true,
      title: 'title',
      toggleExpanded: jest.fn(),
      children: <div>children</div>,
    }
    const { getByRole } = render(props)
    fireEvent.click(getByRole('heading', { name: 'title' }))
    expect(props.toggleExpanded).toHaveBeenCalled()
  })
  it('renders collapsible with different icon and not expanded', () => {
    props = {
      expanded: true,
      title: 'title',
      toggleExpanded: jest.fn(),
      children: <div>children</div>,
      expandedIcon: 'chevron-down',
      collapsedIcon: 'chevron-up',
    }
    const { getByRole, getByText } = render(props)
    fireEvent.click(getByRole('heading', { name: 'title' }))
    expect(props.toggleExpanded).toHaveBeenCalled()
    getByText('children')
  })
  it('renders collapsible with different icon and expanded', () => {
    props = {
      expanded: true,
      title: 'title',
      toggleExpanded: jest.fn(),
      children: <div>children</div>,
      expandedIcon: 'chevron-down',
      collapsedIcon: 'chevron-up',
    }
    const { getByRole } = render(props)
    fireEvent.click(getByRole('heading', { name: 'title' }))
    expect(props.toggleExpanded).toHaveBeenCalled()
  })
})
