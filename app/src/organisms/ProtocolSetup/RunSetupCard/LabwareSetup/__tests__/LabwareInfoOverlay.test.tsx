import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import {
  getLabwareDisplayName,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import { renderWithProviders } from '@opentrons/components/__utils__'
import { i18n } from '../../../../../i18n'
import { LabwareInfoOverlay } from '../LabwareInfoOverlay'

jest.mock('@opentrons/shared-data', () => {
  const actualSharedData = jest.requireActual('@opentrons/shared-data')
  return {
    ...actualSharedData,
    getLabwareDisplayName: jest.fn(),
  }
})

const render = (props: React.ComponentProps<typeof LabwareInfoOverlay>) => {
  return renderWithProviders(
    <svg>
      <LabwareInfoOverlay {...props} />
    </svg>,
    {
      i18nInstance: i18n,
    }
  )
}

const mockGetLabwareDisplayName = getLabwareDisplayName as jest.MockedFunction<
  typeof getLabwareDisplayName
>

describe('LabwareInfoOverlay', () => {
  let props: React.ComponentProps<typeof LabwareInfoOverlay>
  beforeEach(() => {
    props = {
      x: 0,
      y: 0,
      definition: fixture_tiprack_300_ul as LabwareDefinition2,
    }
    when(mockGetLabwareDisplayName)
      .calledWith(props.definition)
      .mockReturnValue('mock display name')
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should render the labware display name', () => {
    const { getByText } = render(props)
    getByText('mock display name')
  })
  it('should render the offset data label', () => {
    const { getByText } = render(props)
    getByText('Offset')
  })
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('should renders labware offset data', () => {
    // implement when data is available
  })
})
