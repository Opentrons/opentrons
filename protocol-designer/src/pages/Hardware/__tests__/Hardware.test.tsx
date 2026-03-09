import { MemoryRouter } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { Hardware } from '..'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../assets/localization'
import { FlexHardware } from '../../../components/organisms'
import { getFileMetadata, getRobotType } from '../../../file-data/selectors'
import { getAdditionalEquipmentEntities } from '../../../step-forms/selectors'

vi.mock('../../../step-forms/selectors')
vi.mock('../../../file-data/selectors')
vi.mock('../../../feature-flags/selectors')
vi.mock('../../../tutorial/selectors')
vi.mock('../../../components/organisms/FlexHardware')
vi.mock('../../../components/organisms/Ot2Modules')
const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <Hardware />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('Hardware', () => {
  beforeEach(() => {
    vi.mocked(getFileMetadata).mockReturnValue({
      protocolName: 'mockProtocolName',
      created: 123,
    })
    vi.mocked(getRobotType).mockReturnValue(FLEX_ROBOT_TYPE)
    vi.mocked(getAdditionalEquipmentEntities).mockReturnValue({})
    vi.mocked(FlexHardware).mockReturnValue(<div>mock FlexHardware</div>)
  })
  it('renders the hardware info for a flex', () => {
    render()
    screen.getByText('mockProtocolName')
    screen.getByText('Edit your deck hardware')
    screen.getByText(
      'Place the modules and fixtures that you are using for this protocol onto the deck.'
    )
    screen.getByText('mock FlexHardware')
  })
  it('renders the hardware info for an ot-2', () => {
    vi.mocked(getRobotType).mockReturnValue(OT2_ROBOT_TYPE)
    render()
    screen.getByText('mockProtocolName')
    screen.getByText('Edit modules')
    screen.getByText(
      'Place the modules that you are using for this protocol onto the deck.'
    )
  })
})
