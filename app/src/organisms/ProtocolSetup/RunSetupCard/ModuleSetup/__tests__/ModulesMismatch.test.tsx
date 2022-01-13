import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import { ModulesMismatch } from '../ModulesMismatch'
import { mockTemperatureModule } from '../../../../../redux/modules/__fixtures__'

const render = (props: React.ComponentProps<typeof ModulesMismatch>) => {
  return renderWithProviders(<ModulesMismatch {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ModulesMismatch', () => {
  let props: React.ComponentProps<typeof ModulesMismatch>
  beforeEach(() => {
    props = { remainingAttachedModules: [mockTemperatureModule] }
  })

  it('should render the correct header', () => {
    const { getByRole } = render(props)
    expect(
      getByRole('heading', {
        name:
          'This robot has connected modules that are not specified in this protocol',
      })
    ).toBeTruthy()
  })
  it('should render the correct body', () => {
    const { getByText } = render(props)
    getByText(
      'If you’re having trouble connecting the modules specifed below, make sure the module’s generation (GEN1 vs GEN2) is correct.'
    )
  })

  it('should call onCloseClick when the close button is pressed', () => {
    const { queryByText, getByRole } = render(props)
    const closeButton = getByRole('button', {
      name: /close/i,
    })
    fireEvent.click(closeButton)
    expect(
      queryByText(
        'This robot has connected modules that are not specified in this protocol'
      )
    ).toBeNull()
  })
})
