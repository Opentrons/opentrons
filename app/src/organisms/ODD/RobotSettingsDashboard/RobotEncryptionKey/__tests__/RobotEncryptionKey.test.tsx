import NiceModal from '@ebay/nice-modal-react'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCACertPasswordQuery } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { refetchTimeForPassword, RobotEncryptionKey } from '..'

import type { ComponentProps } from 'react'
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

const mockGoBack = vi.fn()

const render = (props: ComponentProps<typeof RobotEncryptionKey>) => {
  return renderWithProviders(
    <NiceModal.Provider>
      <RobotEncryptionKey {...props} />
    </NiceModal.Provider>,
    { i18nInstance: i18n }
  )
}

const renderWithModal = (props: ComponentProps<typeof RobotEncryptionKey>) => {
  const view = render(props)
  fireEvent.click(screen.getByText('View robot generated key'))
  return view
}

describe('RobotEncryptionKey', () => {
  let props: ComponentProps<typeof RobotEncryptionKey>

  beforeEach(() => {
    props = {
      setCurrentOption: mockGoBack,
    }
    vi.mocked(useCACertPasswordQuery).mockReturnValue({
      data: {
        data: {
          password: 'lions-tigers-bears',
          valid_from_utc: '2026-04-21T21:45:01.535178Z',
          valid_until_utc: '2026-04-21T21:45:31.535178Z',
        },
      },
    } as UseQueryResult<CACertPassword>)
  })
  it('should render a button', () => {
    render(props)
    screen.getByText('View robot generated key')
  })
  it('should render the modal when clicking the button', () => {
    render(props)
    const viewButton = screen.getByText('View robot generated key')
    fireEvent.click(viewButton)
    screen.getByText(/enter this key into the opentrons app/i)
  })
})

describe('RobotEncryptionKey modal', () => {
  let props: ComponentProps<typeof RobotEncryptionKey>

  beforeEach(() => {
    props = {
      setCurrentOption: mockGoBack,
    }
    vi.mocked(useCACertPasswordQuery).mockReturnValue({
      data: {
        data: {
          password: 'lions-tigers-bears',
          valid_from_utc: '2026-04-21T21:45:01.535178Z',
          valid_until_utc: '2026-04-21T21:45:31.535178Z',
        },
      },
    } as UseQueryResult<CACertPassword>)
  })
  it('should close the modal when clicking ok', () => {
    renderWithModal(props)
    const okButton = screen.getByText('Ok')
    fireEvent.click(okButton)
    expect(
      screen.queryByText(/enter this key into the opentrons app/i)
    ).toBeNull()
  })
  it('should render the password', () => {
    renderWithModal(props)
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
