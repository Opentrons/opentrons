import * as React from 'react'
import { it, describe, expect } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
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
    screen.getByText('How to setup a new robot')

    const closeButton = screen.getByRole('button', { name: 'close' })
    fireEvent.click(closeButton)

    expect(screen.queryByText('How to setup a new robot')).toBeFalsy()
  })
  it('when link is clicked, modal is opened, and closes via x', () => {
    render()

    const link = screen.getByText('See how to set up a new robot')
    fireEvent.click(link)
    expect(screen.getByText('How to setup a new robot')).toBeInTheDocument()

    const xButton = screen.getByRole('button', { name: '' })
    fireEvent.click(xButton)

    expect(screen.queryByText('How to setup a new robot')).toBeFalsy()
  })
})
