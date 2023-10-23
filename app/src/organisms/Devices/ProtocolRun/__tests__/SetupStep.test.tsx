import * as React from 'react'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { SetupStep } from '../SetupStep'

describe('SetupStep', () => {
  const render = ({
    expanded = true,
    title = 'stub title',
    description = 'stub description',
    label = 'stub label',
    toggleExpanded = toggleExpandedMock,
    children = <button>stub children</button>,
    rightElement = <div>right element</div>,
  }: Partial<React.ComponentProps<typeof SetupStep>> = {}) => {
    return renderWithProviders(
      <SetupStep
        {...{
          expanded,
          title,
          description,
          label,
          toggleExpanded,
          children,
          rightElement,
        }}
      />,
      { i18nInstance: i18n }
    )[0]
  }
  let toggleExpandedMock: jest.MockedFunction<() => void>

  beforeEach(() => {
    toggleExpandedMock = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders children', () => {
    const { getByRole } = render()
    getByRole('button', { name: 'stub children' })
  })
  it('calls toggle expanded on click', () => {
    const { getByText } = render({ expanded: false })
    fireEvent.click(getByText('stub title'))
    expect(toggleExpandedMock).toHaveBeenCalled()
  })
  it('renders text nodes with prop contents', () => {
    const { getByText, queryAllByText } = render({ expanded: false })
    getByText('stub label')
    getByText('stub title')
    queryAllByText('stub description')
    queryAllByText('right element')
  })
})
