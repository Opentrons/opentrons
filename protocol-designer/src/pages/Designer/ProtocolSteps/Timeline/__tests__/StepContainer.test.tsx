import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { fireEvent, screen, within } from '@testing-library/react'

import { COLORS } from '@opentrons/components'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { getUnsavedForm } from '/protocol-designer/step-forms/selectors'
import { getDeckSetupForActiveItem } from '/protocol-designer/top-selectors/labware-locations'

import { ConnectedStepContainer } from '../ConnectedStepContainer'
import { StepOverflowMenu } from '../StepOverflowMenu'

import type { ComponentProps } from 'react'

vi.mock('/protocol-designer/step-forms/selectors')
vi.mock('/protocol-designer/ui/steps/actions/actions')
vi.mock('/protocol-designer/ui/steps/selectors')
vi.mock('../StepOverflowMenu')
vi.mock('/protocol-designer/top-selectors/labware-locations')

const render = (props: ComponentProps<typeof ConnectedStepContainer>) => {
  return renderWithProviders(<ConnectedStepContainer {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ConnectedStepContainer', () => {
  let props: ComponentProps<typeof ConnectedStepContainer>

  beforeEach(() => {
    props = {
      title: 'Starting deck state',
      iconName: 'add',
      onClick: vi.fn(),
      selected: false,
      hovered: false,
      stepId: 'mockStepId',
      hasError: false,
      isStepAfterError: false,
      sidebarWidth: 350,
    }
    vi.mocked(StepOverflowMenu).mockReturnValue(
      <div>mock StepOverflowMenu</div>
    )
    vi.mocked(getUnsavedForm).mockReturnValue(null)
    vi.mocked(getDeckSetupForActiveItem).mockReturnValue({
      labware: {},
      modules: {},
      additionalEquipmentOnDeck: {
        trash: { id: 'trash', name: 'trashBin', location: 'cutoutA3' },
      },
      pipettes: {},
    })
  })

  it('renders the starting deck state step', () => {
    render(props)
    fireEvent.click(screen.getByText('Starting deck state'))
    expect(props.onClick).toHaveBeenCalled()
  })
  it('renders the ending deck state step', () => {
    props.title = 'Final deck state'
    render(props)
    screen.getByText('Final deck state')
  })

  it('renders the step title, mock overflow menu and mock step overflow menu', () => {
    props = {
      ...props,
      title: 'Transfer',
      selected: true,
      openedOverflowMenuId: 'mockStepId',
      setOpenedOverflowMenuId: vi.fn(),
    }
    render(props)
    screen.getByText('Transfer')
    expect(screen.getByTestId('StepContainer_mockStepId')).toHaveStyle(
      `background-color: ${COLORS.blue50}`
    )
    expect(screen.getByTestId('StepContainer_mockStepId')).toHaveStyle(
      `color: ${COLORS.white}`
    )
    fireEvent.click(
      within(screen.getByTestId('StepContainer_mockStepId')).getByTestId(
        'StepContainer_OverflowBtn'
      )
    )
    screen.getByText('mock StepOverflowMenu')
  })

  it('render non-active style when selected is false', () => {
    props = {
      ...props,
      title: 'Transfer',
      selected: false,
    }
    render(props)
    expect(screen.getByTestId('StepContainer_mockStepId')).toHaveStyle(
      `background-color: ${COLORS.grey20}`
    )
    expect(screen.getByTestId('StepContainer_mockStepId')).toHaveStyle(
      `color: ${COLORS.black90}`
    )
  })

  it('render error style when hasError is true and selected is true', () => {
    props = {
      ...props,
      title: 'Transfer',
      selected: true,
      hasError: true,
      openedOverflowMenuId: 'mockStepId',
      setOpenedOverflowMenuId: vi.fn(),
    }
    render(props)
    console.log(screen.getByTestId('StepContainer_mockStepId'))
    expect(screen.getByTestId('StepContainer_mockStepId')).toHaveStyle(
      `background-color: ${COLORS.red50}`
    )
    expect(screen.getByTestId('StepContainer_mockStepId')).toHaveStyle(
      `color: ${COLORS.white}`
    )
  })

  it('render non-active error style when hasError is true and selected is false', () => {
    props = {
      ...props,
      title: 'Transfer',
      selected: false,
      hasError: true,
      openedOverflowMenuId: 'mockStepId',
      setOpenedOverflowMenuId: vi.fn(),
    }
    render(props)
    expect(screen.getByTestId('StepContainer_mockStepId')).toHaveStyle(
      `background-color: ${COLORS.red30}`
    )
    expect(screen.getByTestId('StepContainer_mockStepId')).toHaveStyle(
      `color: ${COLORS.red60}`
    )
  })

  it('renders the divider if hover targets that step', () => {
    render({ ...props, dragHovered: true })
    screen.getByTestId('divider')
  })
})
