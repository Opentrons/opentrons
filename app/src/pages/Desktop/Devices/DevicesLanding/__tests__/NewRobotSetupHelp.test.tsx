import { it, describe, expect } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { NewRobotSetupHelp } from '../NewRobotSetupHelp'

const render = () => {
  return renderWithProviders(<NewRobotSetupHelp />, {
    i18nInstance: i18n,
  })
}

describe('NewRobotSetupHelp', () => {
  it('renders link and collapsed modal by default', () => {
    render()

    screen.getByText('See how to set up a new robot')
    expect(screen.queryByText('How to setup a new robot')).toBeFalsy()
  })
  it('when link is clicked, modal is opened, and closes via Close button', () => {
    render()

    const link = screen.getByText('See how to set up a new robot')
    fireEvent.click(link)
    screen.getByText('How to set up a new robot')

    const closeButton = screen.getByRole('button', { name: 'close' })
    fireEvent.click(closeButton)

    expect(screen.queryByText('How to setup a new robot')).toBeFalsy()
  })
  it('when link is clicked, modal is opened, and closes via x', () => {
    render()

    const link = screen.getByText('See how to set up a new robot')
    fireEvent.click(link)
    expect(screen.getByText('How to set up a new robot')).toBeInTheDocument()

    const xButton = screen.getByRole('button', { name: '' })
    fireEvent.click(xButton)

    expect(screen.queryByText('How to set up a new robot')).toBeFalsy()
  })

  it('renders the link and it has the correct href attribute', () => {
    render()
    const link = screen.getByText('See how to set up a new robot')
    fireEvent.click(link)
    const targetLinkUrlFlex =
      'https://insights.opentrons.com/hubfs/Products/Flex/Opentrons%20Flex%20Quickstart%20Guide.pdf'
    const supportLinkFlex = screen.getByRole('link', {
      name: 'Opentrons Flex Quickstart Guide',
    })
    expect(supportLinkFlex).toHaveAttribute('href', targetLinkUrlFlex)

    const targetLinkUrlOt2 =
      'https://insights.opentrons.com/hubfs/Products/OT-2/OT-2%20Quick%20Start%20Guide.pdf'
    const supportLinkOt2 = screen.getByRole('link', {
      name: 'OT-2 Quickstart Guide',
    })
    expect(supportLinkOt2).toHaveAttribute('href', targetLinkUrlOt2)
  })
})
