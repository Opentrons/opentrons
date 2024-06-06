import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, beforeEach, vi, afterEach, expect } from 'vitest'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { SetupStep } from '../SetupStep'

import type { Mock } from 'vitest'

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
  let toggleExpandedMock: Mock

  beforeEach(() => {
    toggleExpandedMock = vi.fn()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders children', () => {
    render()
    screen.getByRole('button', { name: 'stub children' })
  })
  it('calls toggle expanded on click', () => {
    render({ expanded: false })
    fireEvent.click(screen.getByText('stub title'))
    expect(toggleExpandedMock).toHaveBeenCalled()
  })
  it('renders text nodes with prop contents', () => {
    render({ expanded: false })
    screen.getByText('stub label')
    screen.getByText('stub title')
    screen.queryAllByText('stub description')
    screen.queryAllByText('right element')
  })
})
