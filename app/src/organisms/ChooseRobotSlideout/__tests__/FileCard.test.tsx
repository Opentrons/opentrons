import * as React from 'react'
import { vi, it, describe, expect } from 'vitest'

import { StaticRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { FileCard } from '../FileCard'
import type { CsvFileParameter } from '@opentrons/shared-data'

vi.mock('../../../redux/discovery')
vi.mock('../../../redux/robot-update')
vi.mock('../../../redux/networking')
vi.mock('../../../resources/useNotifyDataReady')
vi.mock('../../../redux/config')
const render = (props: React.ComponentProps<typeof FileCard>) => {
  return renderWithProviders(
    <StaticRouter>
      <FileCard {...props} />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

const mockSetRunTimeParametersOverrides = vi.fn()

const mockCsvRunTimeParameterSuccess: CsvFileParameter = {
  displayName: 'My sample file',
  file: { file: { name: 'my_file.csv' } as File },
  variableName: 'my_sample_csv',
  description: 'This is a mock CSV runtime parameter',
  type: 'csv_file',
}

const mockCsvRunTimeParameterError = {
  ...mockCsvRunTimeParameterSuccess,
  file: { file: { name: 'my_bad_file.pdf' } as File },
}

const mockRunTimeParametersOverrides = [mockCsvRunTimeParameterSuccess]

describe('FileCard', () => {
  it('displays the file RTP filename', () => {
    render({
      error: null,
      fileRunTimeParameter: mockCsvRunTimeParameterSuccess,
      runTimeParametersOverrides: mockRunTimeParametersOverrides,
      setRunTimeParametersOverrides: mockSetRunTimeParametersOverrides,
    })
    screen.getByText('my_file.csv')
  })
  it('displays error message if the file type is incorrect', () => {
    render({
      error: 'CSV file type required',
      fileRunTimeParameter: mockCsvRunTimeParameterError,
      runTimeParametersOverrides: mockRunTimeParametersOverrides,
      setRunTimeParametersOverrides: mockSetRunTimeParametersOverrides,
    })
    screen.getByText('CSV file type required')
  })
  it('sets runtime parameters overrides file parameter to null on close', () => {
    render({
      error: 'CSV file type required',
      fileRunTimeParameter: mockCsvRunTimeParameterError,
      runTimeParametersOverrides: mockRunTimeParametersOverrides,
      setRunTimeParametersOverrides: mockSetRunTimeParametersOverrides,
    })
    const xButton = screen.getByTestId('close_button')
    fireEvent.click(xButton)
    expect(mockSetRunTimeParametersOverrides).toBeCalledWith([
      {
        ...mockCsvRunTimeParameterError,
        file: null,
      },
    ])
  })
})
