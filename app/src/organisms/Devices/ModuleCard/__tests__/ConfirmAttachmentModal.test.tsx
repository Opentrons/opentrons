import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../../i18n'
import heaterShakerCommands from '@opentrons/shared-data/protocol/fixtures/6/heaterShakerCommands.json'
import { useHeaterShakerFromProtocol } from '../hooks'
import { ConfirmAttachmentModal } from '../ConfirmAttachmentModal'

import { mockHeaterShaker } from '../../../../redux/modules/__fixtures__'

import type { ProtocolModuleInfo } from '../../../ProtocolSetup/utils/getProtocolModulesInfo'

jest.mock('../hooks')

const mockUseHeaterShakerFromProtocol = useHeaterShakerFromProtocol as jest.MockedFunction<
  typeof useHeaterShakerFromProtocol
>

const render = (props: React.ComponentProps<typeof ConfirmAttachmentModal>) => {
  return renderWithProviders(<ConfirmAttachmentModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const HEATER_SHAKER_PROTOCOL_MODULE_INFO = {
  moduleId: 'heater_shaker_id',
  x: 0,
  y: 0,
  z: 0,
  moduleDef: mockHeaterShaker as any,
  nestedLabwareDef: heaterShakerCommands.labwareDefinitions['example/plate/1'],
  nestedLabwareDisplayName: null,
  nestedLabwareId: null,
  protocolLoadOrder: 1,
  slotName: '1',
} as ProtocolModuleInfo

describe('ConfirmAttachmentBanner', () => {
  let props: React.ComponentProps<typeof ConfirmAttachmentModal>

  beforeEach(() => {
    props = {
      onCloseClick: jest.fn(),
      isProceedToRunModal: false,
      onConfirmClick: jest.fn(),
    }
    mockUseHeaterShakerFromProtocol.mockReturnValue(
      HEATER_SHAKER_PROTOCOL_MODULE_INFO
    )
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders the correct modal info when accessed through set shake slideout', () => {
    const { getByText, getByRole } = render(props)
    getByText('Confirm Heater Shaker Module attachment to deck')
    getByText(
      'Module should have both anchors fully extended for a firm attachment to the deck.'
    )
    getByText('The thermal adapter should be attached to the module.')
    getByText('Don’t show me again')
    getByText('cancel')
    getByText('Confirm attachment')
    const confirmBtn = getByRole('button', { name: 'Confirm attachment' })
    fireEvent.click(confirmBtn)
    expect(props.onConfirmClick).toHaveBeenCalled()
    const cancelbtn = getByRole('button', { name: 'cancel' })
    fireEvent.click(cancelbtn)
    expect(props.onCloseClick).toHaveBeenCalled()
  })

  it('renders the correct modal info when accessed through proceed to run CTA and clicks proceed to run button', () => {
    props = {
      onCloseClick: jest.fn(),
      isProceedToRunModal: true,
      onConfirmClick: jest.fn(),
    }

    const { getByText, getByRole } = render(props)

    getByText(
      'Before the run begins, module should have both anchors fully extended for a firm attachment to Slot 1.'
    )
    getByText('The thermal adapter should be attached to the module.')
    const btn = getByRole('button', { name: 'Proceed to run' })
    fireEvent.click(btn)
    expect(props.onConfirmClick).toHaveBeenCalled()
    const cancelbtn = getByRole('button', { name: 'cancel' })
    fireEvent.click(cancelbtn)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
})
