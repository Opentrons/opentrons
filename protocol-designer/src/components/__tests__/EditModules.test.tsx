import * as React from 'react'
import { screen } from '@testing-library/react'
import { vi, beforeEach, describe, it } from 'vitest'
<<<<<<< HEAD
import {
  FLEX_ROBOT_TYPE,
  OT2_ROBOT_TYPE,
  TEMPERATURE_MODULE_TYPE,
} from '@opentrons/shared-data'
=======
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
import { i18n } from '../../localization'
import { getInitialDeckSetup } from '../../step-forms/selectors'
import { getDismissedHints } from '../../tutorial/selectors'
import { EditModules } from '../EditModules'
import { EditModulesModal } from '../modals/EditModulesModal'
import { renderWithProviders } from '../../__testing-utils__'
<<<<<<< HEAD
import { getEnableMoam } from '../../feature-flags/selectors'
import { getRobotType } from '../../file-data/selectors'
import { EditMultipleModulesModal } from '../modals/EditModulesModal/EditMultipleModulesModal'

import type { HintKey } from '../../tutorial'
=======

import type { HintKey } from '../../tutorial'

vi.mock('../../step-forms/selectors')
vi.mock('../modals/EditModulesModal')
vi.mock('../../tutorial/selectors')
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))

vi.mock('../../step-forms/selectors')
vi.mock('../modals/EditModulesModal/EditMultipleModulesModal')
vi.mock('../modals/EditModulesModal')
vi.mock('../../tutorial/selectors')
vi.mock('../../file-data/selectors')
vi.mock('../../feature-flags/selectors')
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
<<<<<<< HEAD
    vi.mocked(EditMultipleModulesModal).mockReturnValue(
      <div>mock EditMultipleModulesModal</div>
    )
    vi.mocked(getDismissedHints).mockReturnValue([hintKey])
    vi.mocked(getRobotType).mockReturnValue(OT2_ROBOT_TYPE)
    vi.mocked(getEnableMoam).mockReturnValue(true)
=======
    vi.mocked(getDismissedHints).mockReturnValue([hintKey])
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
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
