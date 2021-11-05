import * as React from 'react'
import { screen } from '@testing-library/react'
import { when } from 'jest-when'
import { StatusCard } from '../StatusCard'
import { renderWithProviders } from '@opentrons/components'
import { useFeatureFlag } from '../../../../../redux/config'
import { i18n } from '../../../../../i18n'

jest.mock('../../../../../redux/config')

const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<
  typeof useFeatureFlag
>

describe('StatusCard headers', () => {
  it('should render StatusCard Header', () => {
    when(mockUseFeatureFlag)
      .calledWith('preProtocolFlowWithoutRPC')
      .mockReturnValue(false)
    renderWithProviders(
      <StatusCard
        header={'1'}
        title={'Magnetic Module GEN 2'}
        isCardExpanded={false}
        toggleCard={jest.fn()}
      />,
      { i18nInstance: i18n }
    )
    expect(screen.getByText(/Slot/)).toBeInTheDocument()
  })

  it('should NOT render StatusCard header', () => {
    when(mockUseFeatureFlag)
      .calledWith('preProtocolFlowWithoutRPC')
      .mockReturnValue(false)
    renderWithProviders(
      <StatusCard
        title={'Thermocycler Module'}
        isCardExpanded={false}
        toggleCard={jest.fn()}
      />
    )
    expect(screen.queryByText(/Slot/)).toBeNull()
  })
})
