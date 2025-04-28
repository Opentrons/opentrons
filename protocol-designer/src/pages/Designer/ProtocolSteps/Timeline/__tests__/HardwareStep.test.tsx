import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import { fireEvent, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { renderWithProviders } from '../../../../../__testing-utils__'
import { i18n } from '../../../../../assets/localization'
import { getRobotType } from '../../../../../file-data/selectors'
import { START_TERMINAL_ITEM_ID } from '../../../../../steplist'
import {
  getHoveredTerminalItemId,
  getSelectedTerminalItemId,
} from '../../../../../ui/steps'
import { selectTerminalItem } from '../../../../../ui/steps/actions/actions'
import { HardwareStep } from '../HardwareStep'

vi.mock('../../../../../ui/steps')
vi.mock('../../../../../file-data/selectors')
vi.mock('../../../../../ui/steps/actions/actions')
const render = (props: ComponentProps<typeof HardwareStep>) => {
  return renderWithProviders(<HardwareStep {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('HardwareStep', () => {
  let props: ComponentProps<typeof HardwareStep>

  beforeEach(() => {
    props = {
      sidebarWidth: 190,
    }
    vi.mocked(getRobotType).mockReturnValue(FLEX_ROBOT_TYPE)
    vi.mocked(getSelectedTerminalItemId).mockReturnValue(START_TERMINAL_ITEM_ID)
    vi.mocked(getHoveredTerminalItemId).mockReturnValue(null)
  })
  it('renders the button and copy for a flex', () => {
    render(props)
    screen.getByText('Deck hardware')
    fireEvent.click(screen.getByText('Modules and fixtures'))
    expect(vi.mocked(selectTerminalItem)).toHaveBeenCalled()
  })
  it('renders the button and copy for a flex with small sidebar width', () => {
    props.sidebarWidth = 160
    render(props)
    screen.getByText('Deck hardware')
    expect(screen.queryByText('Modules and fixtures')).not.toBeInTheDocument()
  })
  it('renders the button and copy for an ot-2', () => {
    vi.mocked(getRobotType).mockReturnValue(OT2_ROBOT_TYPE)
    render(props)
    expect(screen.getAllByText('Modules')).toHaveLength(2)
    fireEvent.click(screen.getAllByText('Modules')[1])
    expect(vi.mocked(selectTerminalItem)).toHaveBeenCalled()
  })
})
