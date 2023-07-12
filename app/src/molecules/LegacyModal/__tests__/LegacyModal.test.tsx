import * as React from 'react'

import { COLORS, renderWithProviders } from '@opentrons/components'

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
    const [{ getByText, queryByTestId, getByTestId }] = render(props)
    expect(queryByTestId('Modal_header_icon')).not.toBeInTheDocument()
    getByText('mock info modal')
    expect(getByTestId('Modal_header')).toHaveStyle(
      `background-color: ${COLORS.white}`
    )
  })

  it('should render modal with orange header icon when type is warning', () => {
    props.type = 'warning'
    const [{ getByTestId }] = render(props)
    const headerIcon = getByTestId('Modal_header_icon')
    expect(headerIcon).toBeInTheDocument()
    expect(headerIcon).toHaveStyle(`color: ${COLORS.warningEnabled}`)
    expect(getByTestId('Modal_header')).toHaveStyle(
      `background-color: ${COLORS.white}`
    )
  })

  it('should render modal with red header icon when type is error', () => {
    props.type = 'error'
    const [{ getByTestId }] = render(props)
    const headerIcon = getByTestId('Modal_header_icon')
    expect(headerIcon).toBeInTheDocument()
    expect(headerIcon).toHaveStyle(`color: ${COLORS.errorEnabled}`)
    expect(getByTestId('Modal_header')).toHaveStyle(
      `background-color: ${COLORS.white}`
    )
  })

  it('should render outlined modal when type is outlinedError', () => {
    props.type = 'outlinedError'
    const [{ getByTestId }] = render(props)
    const headerIcon = getByTestId('Modal_header_icon')
    expect(headerIcon).toBeInTheDocument()
    expect(headerIcon).toHaveStyle(`color: ${COLORS.white}`)
    expect(getByTestId('Modal_header')).toHaveStyle(
      `background-color: ${COLORS.errorEnabled}`
    )
  })
})
