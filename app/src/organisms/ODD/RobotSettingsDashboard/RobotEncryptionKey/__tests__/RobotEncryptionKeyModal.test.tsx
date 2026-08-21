import NiceModal from '@ebay/nice-modal-react'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCACertPasswordQuery } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { RobotSettingButton } from '/app/organisms/ODD/RobotSettingsDashboard'
import { useUpdateClientDataEncryptionKeys } from '/app/resources/client_data/encryptionKeys'

import {
  refetchTimeForPassword,
  RobotEncryptionKeyModal,
} from '../RobotEncryptionKeyModal'

import type { UseQueryResult } from 'react-query'
import type { CACertPassword } from '@opentrons/api-client'
import type * as ReactApiClient from '@opentrons/react-api-client'

vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual = await importOriginal<typeof ReactApiClient>()
  return {
    ...actual,
    useCACertPasswordQuery: vi.fn(),
  }
})
vi.mock('/app/resources/client_data/encryptionKeys')
vi.mock('/app/redux-resources/robots', () => ({
  useRobot: vi.fn().mockReturnValue({
    name: 'otie',
    ip: '127.0.0.1',
    port: 31950,
  }),
}))
vi.mock('/app/redux-resources/robots/hooks/useLocalRobotName', () => ({
  useLocalRobotName: vi.fn().mockReturnValue('otie'),
}))

const render = () => {
  return renderWithProviders(
    <NiceModal.Provider>
      <RobotSettingButton
        settingName={'SHOWMODAL'}
        onClick={() => {
          NiceModal.show(RobotEncryptionKeyModal)
        }}
      />
    </NiceModal.Provider>,
    { i18nInstance: i18n }
  )
}

const renderWithModal = () => {
  const view = render()
  fireEvent.click(screen.getByText('SHOWMODAL'))
  return view
}

describe('RobotEncryptionKey modal', () => {
  const mockClearClientData = vi.fn()
  beforeEach(() => {
    vi.mocked(useCACertPasswordQuery).mockReturnValue({
      data: {
        data: {
          password: 'lions-tigers-bears',
          valid_from_utc: '2026-04-21T21:45:01.535178Z',
          valid_until_utc: '2026-04-21T21:45:31.535178Z',
        },
      },
    } as UseQueryResult<CACertPassword>)
    vi.mocked(useUpdateClientDataEncryptionKeys).mockReturnValue({
      clearClientData: mockClearClientData,
    } as any as ReturnType<typeof useUpdateClientDataEncryptionKeys>)
  })
  it('should close the modal when clicking dismiss', () => {
    renderWithModal()
    const dismissButton = screen.getByText('Dismiss')
    fireEvent.click(dismissButton)
    expect(
      screen.queryByText(/enter this key into the opentrons app/i)
    ).toBeNull()
  })
  it('should clear client data when clicking dismiss', () => {
    renderWithModal()
    const dismissButton = screen.getByText('Dismiss')
    fireEvent.click(dismissButton)
    expect(mockClearClientData).toHaveBeenCalled()
  })
  it('should render the password', () => {
    renderWithModal()
    screen.getByText('lions-tigers-bears')
  })
})

describe('RobotEncryptionKey refetching', () => {
  it('should specify the time until the password expires', () => {
    expect(
      refetchTimeForPassword(
        new Date('2026-04-21T21:45:16.535178Z'),
        new Date('2026-04-21T21:45:31.535178Z')
      )
    ).toBeCloseTo(15000)
  })
  it('should specify 1ms if the password has expired', () => {
    expect(
      refetchTimeForPassword(
        new Date('2026-04-21T21:45:55.535178Z'),
        new Date('2026-04-21T21:45:31.535178Z')
      )
    ).toEqual(1)
  })
})
