import * as React from 'react'
import { resetAllWhenMocks } from 'jest-when'
import { ModalPage, renderWithProviders } from '@opentrons/components'
import { DeprecatedConfirmPickUpTipModal } from '../DeprecatedConfirmPickUpTipModal'
import { i18n } from '../../../../i18n'

jest.mock('@opentrons/components', () => {
  const actualComponents = jest.requireActual('@opentrons/components')
  return {
    ...actualComponents,
    ModalPage: jest.fn(() => <div></div>),
  }
})

const mockModalPage = ModalPage as jest.MockedFunction<typeof ModalPage>

const render = (
  props: React.ComponentProps<typeof DeprecatedConfirmPickUpTipModal>
) => {
  return renderWithProviders(
    <ModalPage
      titleBar={{
        title: 'modal page title',
      }}
    >
      <DeprecatedConfirmPickUpTipModal {...props} />
    </ModalPage>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('DeprecatedConfirmPickUpTipModal', () => {
  let props: React.ComponentProps<typeof DeprecatedConfirmPickUpTipModal>

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
    const { getByText } = render(props)
    getByText('mock alert item')
  })
})
