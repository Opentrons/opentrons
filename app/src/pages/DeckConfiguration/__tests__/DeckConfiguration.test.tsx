import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { DeckConfiguration } from '..'

const render = () => {
  return (<renderWithProviders />), {}
}
