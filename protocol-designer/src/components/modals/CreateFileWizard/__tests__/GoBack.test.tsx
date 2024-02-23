import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../localization'
import { GoBack } from '../GoBack'

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

    fireEvent.click(getByLabelText('GoBack_button'))
    expect(props.onClick).toHaveBeenCalled()
  })
})
