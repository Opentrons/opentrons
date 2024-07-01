import * as React from 'react'
import { describe, it, beforeEach, vi, expect } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'

import { i18n } from '../../../i18n'
import { renderWithProviders } from '../../../__testing-utils__'
import { EmptyFile } from '../EmptyFile'
import { mockConnectedRobot } from '../../../redux/discovery/__fixtures__'
import { getLocalRobot } from '../../../redux/discovery'
import { getShellUpdateDataFiles } from '../../../redux/shell'
import { useAllCsvFilesQuery } from '@opentrons/react-api-client'
import { ChooseCsvFile } from '../ChooseCsvFile'

import type { CsvFileParameter } from '@opentrons/shared-data'

vi.mock('../../../redux/discovery')
vi.mock('../../../redux/shell')
vi.mock('../EmptyFile')

const mockHandleGoBack = vi.fn()
const mockSetParameter = vi.fn()
const mockParameter: CsvFileParameter = {} as any
const mockSetFileInfo = vi.fn()
const PROTOCOL_ID = 'fake_protocol_id'
const mockUsbData = {
  type: 'shell:SEND_FILE_PATHS',
  payload: {
    filePaths: [
      '/media/mock-usb-drive/mock-file1.csv',
      '/media/mock-usb-drive/mock-file2.csv',
      '/media/mock-usb-drive/mock-file3.csv',
    ],
  },
  meta: { shell: true },
} as any

const mockEmptyUsbData = {
  ...mockUsbData,
  payload: {
    filePaths: [],
  },
} as any

const render = (props: React.ComponentProps<typeof ChooseCsvFile>) => {
  return renderWithProviders(<ChooseCsvFile {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ChooseCsvFile', () => {
  let props: React.ComponentProps<typeof ChooseCsvFile>
  beforeEach(() => {
    props = {
      protocolId: PROTOCOL_ID,
      handleGoBack: mockHandleGoBack,
      parameter: mockParameter,
      setParameter: mockSetParameter,
      csvFileInfo: 'mockFileId',
      setCsvFileInfo: mockSetFileInfo,
    }
    vi.mocked(getLocalRobot).mockReturnValue(mockConnectedRobot)
    vi.mocked(EmptyFile).mockReturnValue(<div>mock EmptyFile</div>)
    vi.mocked(getShellUpdateDataFiles).mockReturnValue(mockUsbData)
    vi.mocked(useAllCsvFilesQuery)
  })
  it('should render text and buttons', () => {
    render(props)
    screen.getByText('Choose CSV file')
    screen.getByText('CSV files on robot')
    screen.getByText('CSV files on USB')
    screen.getByText('Confirm selection')
    screen.getByText('mock-file1.csv')
    screen.getByText('mock-file2.csv')
    screen.getByText('mock-file3.csv')
  })

  it('should call a mock function when tapping back button', () => {
    render(props)
    fireEvent.click(screen.getAllByRole('button')[0])
    expect(mockHandleGoBack).toHaveBeenCalled()
  })

  it.todo('should call a mock function when tapping a csv file')

  it('should render mock empty file component when there is no csv file', () => {
    vi.mocked(getShellUpdateDataFiles).mockReturnValue(mockEmptyUsbData)
    render(props)
    expect(screen.getAllByText('mock EmptyFile').length).toBe(2)
  })
})
