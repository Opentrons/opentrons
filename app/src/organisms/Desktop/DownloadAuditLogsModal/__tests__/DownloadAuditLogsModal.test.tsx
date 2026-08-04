import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { DownloadAuditLogsModal } from '..'

import type { ComponentProps } from 'react'

vi.mock('/app/App/portal', () => ({
  getTopPortalEl: () => global.document.body,
}))

const render = (props: ComponentProps<typeof DownloadAuditLogsModal>) => {
  return renderWithProviders(<DownloadAuditLogsModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('DownloadAuditLogsModal', () => {
  let props: ComponentProps<typeof DownloadAuditLogsModal>

  beforeEach(() => {
    props = {
      logPeriodId: 'log-period-1',
      onDownload: vi.fn(),
    }
  })

  it('renders the warning title, description, and download button', () => {
    render(props)
    expect(screen.getAllByText('Download audit logs')).toHaveLength(2)
    screen.getByText(
      'Audit logs are not saved to the robot and must be downloaded locally before continuing. Once this session ends, the data cannot be recovered.'
    )
  })

  it('calls onDownload when the download button is clicked', () => {
    render(props)
    screen.getByRole('button', { name: 'Download audit logs' }).click()
    expect(props.onDownload).toHaveBeenCalled()
  })

  it('cannot be dismissed via a close control', () => {
    render(props)
    expect(
      screen.queryByTestId('ModalHeader_icon_close_Download audit logs')
    ).not.toBeInTheDocument()
  })
})
