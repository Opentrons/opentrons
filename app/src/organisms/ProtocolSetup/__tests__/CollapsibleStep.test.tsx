import * as React from 'react'
import '@testing-library/jest-dom'
import { renderWithProviders } from '@opentrons/components/__utils__'

import { i18n } from '../../../i18n'
import { CollapsibleStep } from '../CollapsibleStep'
import { fireEvent } from '@testing-library/react'

describe('CollapsibleStep', () => {
  let render: (
    props?: Partial<React.ComponentProps<typeof CollapsibleStep>>
  ) => ReturnType<typeof renderWithProviders>
  let toggleExpandedMock: jest.MockedFunction<() => void>

  beforeEach(() => {
    toggleExpandedMock = jest.fn()
    render = ({
      expanded = true,
      title = 'stub title',
      description = 'stub description',
      label = 'stub label',
      toggleExpanded = toggleExpandedMock,
      children = <button>stub children</button>,
    } = {}) => {
      return renderWithProviders(
        <CollapsibleStep
          {...{ expanded, title, description, label, toggleExpanded, children }}
        />,
        { i18nInstance: i18n }
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders children if expanded is true', () => {
    const { getByRole } = render()
    expect(getByRole('button', { name: 'stub children' })).toBeTruthy()
  })
  it('does not render children if expanded is false', () => {
    const { queryByRole } = render({ expanded: false })
    expect(queryByRole('button')).toBeNull()
  })
  it('calls toggle expanded on click', () => {
    const { getByRole } = render({ expanded: false })
    fireEvent.click(getByRole('heading', { name: 'stub title' }))
    expect(toggleExpandedMock).toHaveBeenCalled()
  })
  it('renders text nodes with prop contents', () => {
    const { getByRole, queryAllByText } = render({ expanded: false })
    expect(getByRole('heading', { name: 'stub label' })).toBeTruthy()
    expect(getByRole('heading', { name: 'stub title' })).toBeTruthy()
    expect(queryAllByText('stub description')).toBeTruthy()
  })
})
