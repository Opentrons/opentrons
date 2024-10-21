import type * as React from 'react'
import { screen } from '@testing-library/react'
import { vi, beforeEach, describe, it } from 'vitest'
import {
  FLEX_ROBOT_TYPE,
  OT2_ROBOT_TYPE,
  TEMPERATURE_MODULE_TYPE,
} from '@opentrons/shared-data'
import { i18n } from '../../assets/localization'
import { getInitialDeckSetup } from '../../step-forms/selectors'
import { getDismissedHints } from '../../tutorial/selectors'
import { renderWithProviders } from '../../__testing-utils__'
import { getRobotType } from '../../file-data/selectors'
import { EditMultipleModulesModal } from '../modals/EditModulesModal/EditMultipleModulesModal'
import { EditModules } from '../EditModules'
import { EditModulesModal } from '../modals/EditModulesModal'

import type { HintKey } from '../../tutorial'

vi.mock('../../feature-flags/selectors')
vi.mock('../../step-forms/selectors')
vi.mock('../modals/EditModulesModal/EditMultipleModulesModal')
vi.mock('../modals/EditModulesModal')
vi.mock('../../tutorial/selectors')
vi.mock('../../file-data/selectors')
const render = (props: React.ComponentProps<typeof EditModules>) => {
  return renderWithProviders(<EditModules {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockId = 'mockId'
const hintKey: HintKey = 'change_magnet_module_model'

describe('EditModules', () => {
  let props: React.ComponentProps<typeof EditModules>

  beforeEach(() => {
    props = {
      onCloseClick: vi.fn(),
      moduleToEdit: {
        moduleType: 'heaterShakerModuleType',
        moduleId: mockId,
      },
    }
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      modules: {
        [mockId]: {
          id: mockId,
          type: 'heaterShakerModuleType',
          model: 'heaterShakerModuleV1',
          slot: 'A1',
          moduleState: {} as any,
        },
      },
      pipettes: {},
      labware: {},
      additionalEquipmentOnDeck: {},
    })
    vi.mocked(EditModulesModal).mockReturnValue(
      <div>mock EditModulesModal</div>
    )
    vi.mocked(EditMultipleModulesModal).mockReturnValue(
      <div>mock EditMultipleModulesModal</div>
    )
    vi.mocked(getDismissedHints).mockReturnValue([hintKey])
    vi.mocked(getRobotType).mockReturnValue(OT2_ROBOT_TYPE)
  })

  it('renders the edit modules modal for single modules', () => {
    render(props)
    screen.getByText('mock EditModulesModal')
  })
  it('renders multiple edit modules modal', () => {
    props.moduleToEdit.moduleType = TEMPERATURE_MODULE_TYPE
    vi.mocked(getRobotType).mockReturnValue(FLEX_ROBOT_TYPE)
    render(props)
    screen.getByText('mock EditMultipleModulesModal')
  })
})
