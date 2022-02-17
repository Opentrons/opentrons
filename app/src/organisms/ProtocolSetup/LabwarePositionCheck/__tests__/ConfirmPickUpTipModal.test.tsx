import * as React from 'react'
import { resetAllWhenMocks } from 'jest-when'
import { DeprecatedModalPage, renderWithProviders } from '@opentrons/components'
import { ConfirmPickUpTipModal } from '../ConfirmPickUpTipModal'
import { i18n } from '../../../../i18n'

jest.mock('@opentrons/components', () => {
  const actualComponents = jest.requireActual('@opentrons/components')
  return {
    ...actualComponents,
    ModalPage: jest.fn(() => <div></div>),
  }
})

const mockModalPage = DeprecatedModalPage as jest.MockedFunction<
  typeof DeprecatedModalPage
>

const render = (props: React.ComponentProps<typeof ConfirmPickUpTipModal>) => {
  return renderWithProviders(
    <DeprecatedModalPage
      titleBar={{
        title: 'modal page title',
      }}
    >
      <ConfirmPickUpTipModal {...props} />
    </DeprecatedModalPage>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('ConfirmPickUpTipModal', () => {
  let props: React.ComponentProps<typeof ConfirmPickUpTipModal>

  beforeEach(() => {
    props = {
      onConfirm: jest.fn(),
      onDeny: jest.fn(),
      confirmText: 'confirm text',
    }
    mockModalPage.mockReturnValue(<div>mock alert item</div>)
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })
  it('should render an alert modal with the correct props', () => {
    // mockAlertModal.mockImplementation(args => console.log(args))
    const { getByText } = render(props)
    getByText('mock alert item')
  })
})
