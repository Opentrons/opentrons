import * as React from 'react'
import i18n from 'i18next'
import { renderWithProviders } from '@opentrons/components'
import { GoBack } from '../GoBack'
import { fireEvent } from '@testing-library/react'

const render = (props: React.ComponentProps<typeof GoBack>) => {
  return renderWithProviders(<GoBack {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('GoBack', () => {
  let props: React.ComponentProps<typeof GoBack>

  beforeEach(() => {
    props = {
      onClick: jest.fn(),
    }
  })

  it('the go back renders and clicking on it calls prop', () => {
    const { getByLabelText } = render(props)

    const goBackButton = getByLabelText('GoBack_button')
    fireEvent.click(goBackButton)

    expect(props.onClick).toHaveBeenCalled()
  })
})
