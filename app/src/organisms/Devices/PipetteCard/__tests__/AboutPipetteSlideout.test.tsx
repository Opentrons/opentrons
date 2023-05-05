import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'

import { i18n } from '../../../../i18n'
import { mockLeftSpecs } from '../../../../redux/pipettes/__fixtures__'
import { AboutPipetteSlideout } from '../AboutPipetteSlideout'

const render = (props: React.ComponentProps<typeof AboutPipetteSlideout>) => {
  return renderWithProviders(<AboutPipetteSlideout {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('AboutPipetteSlideout', () => {
  let props: React.ComponentProps<typeof AboutPipetteSlideout>
  beforeEach(() => {
    props = {
      pipetteId: '123',
      pipetteName: mockLeftSpecs.displayName,
      isExpanded: true,
      onCloseClick: jest.fn(),
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct info', () => {
    const { getByText, getByRole } = render(props)

    getByText('About Left Pipette Pipette')
    getByText('123')
    getByText('Serial Number')
    const button = getByRole('button', { name: /exit/i })
    fireEvent.click(button)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
})
