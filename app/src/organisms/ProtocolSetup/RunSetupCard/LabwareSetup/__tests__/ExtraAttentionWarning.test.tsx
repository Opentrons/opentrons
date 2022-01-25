import * as React from 'react'
import { when } from 'jest-when'
import { fireEvent, screen } from '@testing-library/react'
import {
  partialComponentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import { ExtraAttentionWarning } from '../ExtraAttentionWarning'
import { SecureLabwareModal } from '../SecureLabwareModal'

jest.mock('../SecureLabwareModal')

const mockSecureLabwareModal = SecureLabwareModal as jest.MockedFunction<
  typeof SecureLabwareModal
>
const render = (props: React.ComponentProps<typeof ExtraAttentionWarning>) => {
  return renderWithProviders(<ExtraAttentionWarning {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ExtraAttentionWarning', () => {
  let props: React.ComponentProps<typeof ExtraAttentionWarning>
  beforeEach(() => {
    props = { moduleTypes: [] }
  })

  it('should render the correct header', () => {
    const { getByRole } = render(props)

    getByRole('heading', {
      name: 'Secure labware and modules before proceeding to run',
    })
  })
  it('should click on the X icon and close the warning label', () => {
    const { queryByText, getByRole } = render(props)
    const closeButton = getByRole('button', {
      name: /close/i,
    })
    getByRole('heading', {
      name: 'Secure labware and modules before proceeding to run',
    })

    fireEvent.click(closeButton)

    expect(
      queryByText('Secure labware and modules before proceeding to run')
    ).toBeNull()
  })
  it('should render the correct text for the mag mod', () => {
    props = {
      ...props,
      moduleTypes: ['magneticModuleType'],
    }
    const { getByText, getByRole } = render(props)
    getByRole('heading', {
      name: 'Magnetic Module',
    })
    getByText(
      'Opentrons recommends securing labware with the module’s bracket.'
    )
    getByText('See how to secure labware to the Magnetic Module')
  })
  it('should render the correct text for the TC', () => {
    props = {
      ...props,
      moduleTypes: ['thermocyclerModuleType'],
    }
    const { getByRole, getByText } = render(props)
    getByRole('heading', {
      name: 'Thermocycler',
    })
    getByText('Labware must be secured with the module’s latch.')
    getByText('See how to secure labware to the Thermocyler Module')
    getByText(
      'Thermocycler lid must be open when robot moves to the slots it occupies. Opentrons will automatically open the lid to move to these slots during Labware Position Check.'
    )
  })
  it('should open the secure labware modal for the mag mod when clicking on the link', () => {
    props = {
      ...props,
      moduleTypes: ['magneticModuleType'],
    }

    when(mockSecureLabwareModal)
      .calledWith(
        partialComponentPropsMatcher({
          type: 'magneticModuleType',
        })
      )
      .mockReturnValue(<div>mock secure labware modal magnetic module</div>)

    const { getByText } = render(props)
    expect(
      screen.queryByText('mock secure labware modal magnetic module')
    ).toBeNull()

    const modalLink = getByText(
      'See how to secure labware to the Magnetic Module'
    )

    fireEvent.click(modalLink)
    getByText('mock secure labware modal magnetic module')
  })
  it('should open the secure labware modal for the TC when clicking on the link', () => {
    props = {
      ...props,
      moduleTypes: ['thermocyclerModuleType'],
    }

    when(mockSecureLabwareModal)
      .calledWith(
        partialComponentPropsMatcher({
          type: 'thermocyclerModuleType',
        })
      )
      .mockReturnValue(<div>mock secure labware modal thermocycler</div>)

    const { getByText } = render(props)
    expect(
      screen.queryByText('mock secure labware modal thermocycler')
    ).toBeNull()

    const modalLink = getByText(
      'See how to secure labware to the Thermocyler Module'
    )

    fireEvent.click(modalLink)
    getByText('mock secure labware modal thermocycler')
  })
})
