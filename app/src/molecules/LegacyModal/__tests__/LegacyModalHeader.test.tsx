import * as React from 'react'

import {
  ALIGN_CENTER,
  COLORS,
  JUSTIFY_CENTER,
  renderWithProviders,
  SPACING,
} from '@opentrons/components'

import { LegacyModalHeader } from '../LegacyModalHeader'

const mockClose = jest.fn()

const render = (props: React.ComponentProps<typeof LegacyModalHeader>) => {
  return renderWithProviders(<LegacyModalHeader {...props} />)
}

describe('LegacyModalHeader', () => {
  let props: React.ComponentProps<typeof LegacyModalHeader>

  beforeEach(() => {
    props = {
      onClose: mockClose,
      title: 'mock modal header title',
      backgroundColor: COLORS.white,
      color: COLORS.darkBlackEnabled,
    }
  })

  it('should render text and close icon', () => {
    const [{ getByText, getByTestId }] = render(props)
    const title = getByText('mock modal header title')
    expect(title).toHaveStyle(`color: ${COLORS.darkBlackEnabled}`)
    getByTestId('ModalHeader_icon_close_mock modal header title')
  })

  it('should render text, icon, and close icon', () => {
    props.icon = {
      name: 'ot-alert',
      color: COLORS.darkBlackEnabled,
      size: '1.25rem',
      marginRight: SPACING.spacing8,
    }
    const [{ getByTestId }] = render(props)
    expect(getByTestId('Modal_header_icon')).toHaveStyle(
      `color: ${COLORS.darkBlackEnabled}`
    )
    expect(getByTestId('Modal_header_icon')).toHaveStyle(`width: 1.25rem`)
    expect(getByTestId('Modal_header_icon')).toHaveStyle(`height: 1.25rem`)
    expect(getByTestId('Modal_header_icon')).toHaveStyle(
      `margin-right: ${SPACING.spacing8}`
    )
  })

  it('should call a mock function when clicking close icon', () => {
    const [{ getByTestId }] = render(props)
    const closeIcon = getByTestId(
      'ModalHeader_icon_close_mock modal header title'
    )
    expect(closeIcon).toHaveStyle('width: 1.625rem')
    expect(closeIcon).toHaveStyle('height: 1.625rem')
    expect(closeIcon).toHaveStyle('display: flex')
    expect(closeIcon).toHaveStyle(`justify-content: ${JUSTIFY_CENTER}`)
    expect(closeIcon).toHaveStyle(`align-items: ${ALIGN_CENTER}`)
    expect(closeIcon).toHaveStyle('border-radius: 0.875rem')
    expect(closeIcon).toHaveStyleRule(
      'background-color',
      COLORS.lightGreyHover,
      {
        modifier: ':hover',
      }
    )
    expect(closeIcon).toHaveStyleRule(
      'background-color',
      COLORS.lightGreyPressed,
      {
        modifier: ':active',
      }
    )
    closeIcon.click()
    expect(mockClose).toHaveBeenCalled()
  })
})
