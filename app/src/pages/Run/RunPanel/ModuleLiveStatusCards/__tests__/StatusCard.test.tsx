import * as React from 'react'
import { screen } from '@testing-library/react'
import { StatusCard } from '../StatusCard'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'

jest.mock('../../../../../redux/config')

describe('StatusCard headers', () => {
  it('should render StatusCard Header', () => {
    renderWithProviders(
      <StatusCard
        header={'1'}
        title={'Magnetic Module GEN 2'}
        isCardExpanded={false}
        toggleCard={jest.fn()}
      />,
      { i18nInstance: i18n }
    )
    expect(screen.getByText(/Slot/)).toBeInTheDocument()
  })
})
