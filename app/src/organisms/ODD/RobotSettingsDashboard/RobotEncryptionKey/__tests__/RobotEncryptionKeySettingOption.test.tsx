import NiceModal from '@ebay/nice-modal-react'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useUpdateClientDataEncryptionKeys } from '/app/resources/client_data/encryptionKeys'

import { RobotEncryptionKeySettingOption } from '..'
import { RobotEncryptionKeyModal } from '../RobotEncryptionKeyModal'

import type { ComponentProps } from 'react'
import type * as ReactApiClient from '@opentrons/react-api-client'

vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual = await importOriginal<typeof ReactApiClient>()
  return {
    ...actual,
    useCACertPasswordQuery: vi.fn(),
  }
})
vi.mock('../RobotEncryptionKeyModal')
vi.mock('/app/resources/client_data/encryptionKeys')

describe('RobotEncryptionKey', () => {
  vi.mocked(RobotEncryptionKeyModal).mockReturnValue(
    <div>MOCK MODAL CONTENT</div>
  )
  const mockRequestKeyDisplay = vi.fn()
  vi.mocked(useUpdateClientDataEncryptionKeys).mockReturnValue({
    requestKeyDisplay: mockRequestKeyDisplay,
  } as any as ReturnType<typeof useUpdateClientDataEncryptionKeys>)

  const mockGoBack = vi.fn()

  const render = (
    props: ComponentProps<typeof RobotEncryptionKeySettingOption>
  ) => {
    return renderWithProviders(
      <NiceModal.Provider>
        <RobotEncryptionKeySettingOption {...props} />
      </NiceModal.Provider>,
      { i18nInstance: i18n }
    )
  }

  let props: ComponentProps<typeof RobotEncryptionKeySettingOption>
  beforeEach(() => {
    props = {
      setCurrentOption: mockGoBack,
    }
  })
  it('should render a button', () => {
    render(props)
    screen.getByText('View robot generated key')
  })
  it('should render the modal when clicking the button', () => {
    render(props)
    const viewButton = screen.getByText('View robot generated key')
    fireEvent.click(viewButton)
    screen.getByText('MOCK MODAL CONTENT')
  })
  it('should request key display when clicking the button', () => {
    render(props)
    const viewButton = screen.getByText('View robot generated key')
    fireEvent.click(viewButton)
    expect(mockRequestKeyDisplay).toHaveBeenCalled()
  })
})
