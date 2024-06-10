import * as React from 'react'
import { describe, it, beforeEach, vi, expect } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'

import { i18n } from '../../../i18n'
import { renderWithProviders } from '../../../__testing-utils__'
import { EmptyFile } from '../EmptyFile'
import { mockConnectedRobot } from '../../../redux/discovery/__fixtures__'
import { getLocalRobot } from '../../../redux/discovery'
import { ChooseCsvFile } from '../ChooseCsvFile'

import type { RunTimeParameter } from '@opentrons/shared-data'

vi.mock('../../../redux/discovery')
vi.mock('../EmptyFile')

const mockHandleGoBack = vi.fn()
const mockSetParameter = vi.fn()
const mockParameter: RunTimeParameter = {} as any

const render = (props: React.ComponentProps<typeof ChooseCsvFile>) => {
  return renderWithProviders(<ChooseCsvFile {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ChooseCsvFile', () => {
  let props: React.ComponentProps<typeof ChooseCsvFile>
  beforeEach(() => {
    props = {
      handleGoBack: mockHandleGoBack,
      parameter: mockParameter,
      setParameter: mockSetParameter,
    }
    vi.mocked(getLocalRobot).mockReturnValue(mockConnectedRobot)
    vi.mocked(EmptyFile).mockReturnValue(<div>mock EmptyFile</div>)
  })
  it('should render text and buttons', () => {
    render(props)
    screen.getByText('CSV file')
    screen.getByText('CSV files on opentrons-robot-name')
    screen.getByText('CSV files on USB')
    screen.getByText('Confirm selection')
  })

  it('should call a mock function when tapping back button', () => {
    render(props)
    fireEvent.click(screen.getAllByRole('button')[0])
    expect(mockHandleGoBack).toHaveBeenCalled()
  })

  it('should call a mock function when tapping a csv file', () => {})

  it('should render mock empty file component when there is no csv file', () => {})
})
