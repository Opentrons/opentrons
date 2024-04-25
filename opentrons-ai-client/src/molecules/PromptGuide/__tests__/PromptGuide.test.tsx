import React from 'react'
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'

import { PromptGuide } from '../index'

const LABWARE_LIBRARY_URL = 'https://labware.opentrons.com/'

const render = () => {
  return renderWithProviders(<PromptGuide />, { i18nInstance: i18n })
}

describe('PromptGuide', () => {
  it('should render text', () => {
    render()
    screen.getByText('What type of protocol do you need?')
    screen.getByText('Make sure your prompt includes the following:')
    screen.getByText('Metadata: Three pieces of information.')
    screen.getByText(
      "Application: Your protocol's name, describing what it does."
    )
    screen.getByText('Robot: OT-2.')
    screen.getByText('API: An API level is 2.15')
    screen.getByText(
      'OT-2 pipettes: Include volume, number of channels, and generation.'
    )
    screen.getByText('Modules: Thermocycler or Temperature Module.')
    screen.getByText(
      'Well allocations: Describe where liquids should go in labware.'
    )
    screen.getByText(
      "Commands: List the protocol's steps, specifying quantities in microliters and giving exact source and destination locations."
    )
    screen.getByText(
      'What if you don’t provide all of those pieces of information?'
    )
    screen.getByText('OpentronsAI asks you to provide it!')
    screen.getByText(
      'Once OpentronsAI has written your protocol, type "simulate" in the prompt box to try it out.'
    )
  })
  it('should have the right url', () => {
    render()
    const link = screen.getByRole('link', { name: 'Opentrons Labware Library' })
    expect(link).toHaveAttribute('href', LABWARE_LIBRARY_URL)
  })
})
