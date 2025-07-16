import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import { FlexHardware, Ot2Modules } from '../../../../components/organisms'
import { getRobotType } from '../../../../file-data/selectors'
import { TimelineEditHardware } from '../TimelineEditHardware'

vi.mock('../../../../components/organisms/FlexHardware')
vi.mock('../../../../components/organisms/Ot2Modules')
vi.mock('../../../../file-data/selectors')
const render = () => {
  return renderWithProviders(<TimelineEditHardware />, {
    i18nInstance: i18n,
  })[0]
}

describe('TimelineEditHardware', () => {
  beforeEach(() => {
    vi.mocked(getRobotType).mockReturnValue(FLEX_ROBOT_TYPE)
    vi.mocked(FlexHardware).mockReturnValue(<div>mock FlexHardware</div>)
    vi.mocked(Ot2Modules).mockReturnValue(<div>mock Ot2Modules</div>)
  })
  it('renders the copy and component for flex', () => {
    render()
    screen.getByText(
      'Edit your deck hardware by placing modules and fixtures onto the deck'
    )
    screen.getByText('mock FlexHardware')
  })
  it('renders the copy and component for ot-2', () => {
    vi.mocked(getRobotType).mockReturnValue(OT2_ROBOT_TYPE)
    render()
    screen.getByText(
      'Place the modules that you are using for this protocol onto the deck.'
    )
    screen.getByText('mock Ot2Modules')
  })
})
