import * as React from 'react'
import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { COLORS } from '@opentrons/components'
import { renderWithProviders } from '../../../__testing-utils__'
import { LegacyModal } from '..'

const render = (props: React.ComponentProps<typeof LegacyModal>) => {
  return renderWithProviders(<LegacyModal {...props} />)
}

describe('LegacyModal', () => {
  let props: React.ComponentProps<typeof LegacyModal>

  beforeEach(() => {
    props = {
      type: 'info',
      title: 'mock info modal',
      children: <div>mock modal content</div>,
    }
  })

  it('should render modal without header icon when type is info', () => {
    render(props)
    expect(screen.queryByTestId('Modal_header_icon')).not.toBeInTheDocument()
    screen.getByText('mock info modal')
    expect(screen.getByTestId('Modal_header')).toHaveStyle(
      `background-color: ${COLORS.white}`
    )
  })

  it('should render modal with orange header icon when type is warning', () => {
    props.type = 'warning'
    render(props)
    const headerIcon = screen.getByTestId('Modal_header_icon')
    expect(headerIcon).toBeInTheDocument()
    expect(headerIcon).toHaveStyle(`color: ${COLORS.yellow50}`)
    expect(screen.getByTestId('Modal_header')).toHaveStyle(
      `background-color: ${COLORS.white}`
    )
  })

  it('should render modal with red header icon when type is error', () => {
    props.type = 'error'
    render(props)
    const headerIcon = screen.getByTestId('Modal_header_icon')
    expect(headerIcon).toBeInTheDocument()
    expect(headerIcon).toHaveStyle(`color: ${COLORS.red50}`)
    expect(screen.getByTestId('Modal_header')).toHaveStyle(
      `background-color: ${COLORS.white}`
    )
  })
})
