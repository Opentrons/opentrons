import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { fireEvent, screen, within } from '@testing-library/react'

import { COLORS } from '@opentrons/components'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import {
  getInitialDeckSetup,
  getUnsavedForm,
} from '/protocol-designer/step-forms/selectors'
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
      stepNumber: null,
      text: 'Starting deck state',
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
    vi.mocked(getInitialDeckSetup).mockReturnValue({
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
    props.text = 'Final deck state'
    render(props)
    screen.getByText('Final deck state')
  })

  it('renders the overflow menu button when active (selected)', () => {
    props = {
      ...props,
      selected: true,
      openedOverflowMenuId: 'mockStepId',
      setOpenedOverflowMenuId: vi.fn(),
    }
    render(props)

    fireEvent.click(
      within(screen.getByLabelText('Starting deck state')).getByLabelText(
        'Starting deck state options'
      )
    )
    screen.getByText('mock StepOverflowMenu')
  })

  it('renders the active (selected) style', () => {
    props = {
      ...props,
      stepNumber: 123,
      text: 'Transfer',
      subtext: 'Subtext',
      selected: true,
    }
    render(props)

    const stepNumber = screen.getByText('123.')
    const text = screen.getByText('Transfer')
    const subtext = screen.getByText('Subtext')

    expect(stepNumber).toHaveStyle(`color: ${COLORS.white}`)
    expect(text).toHaveStyle(`color: ${COLORS.white}`)
    expect(subtext).toHaveStyle(`color: ${COLORS.transparentWhite80}`)
  })

  it('renders the non-active (non-selected) style', () => {
    props = {
      ...props,
      stepNumber: 123,
      text: 'Transfer',
      subtext: 'Subtext',
      selected: false,
    }
    render(props)
    const stepNumber = screen.getByText('123.')
    const text = screen.getByText('Transfer')
    const subtext = screen.getByText('Subtext')

    expect(stepNumber).toHaveStyle(`color: ${COLORS.black90}`)
    expect(text).toHaveStyle(`color: ${COLORS.black90}`)
    expect(subtext).toHaveStyle(`color: ${COLORS.grey60}`)
  })

  it('renders the error + selected style', () => {
    props = {
      ...props,
      stepNumber: 123,
      text: 'Transfer',
      subtext: 'Subtext',
      selected: true,
      hasError: true,
      openedOverflowMenuId: 'mockStepId',
      setOpenedOverflowMenuId: vi.fn(),
    }
    render(props)
    const stepNumber = screen.getByText('123.')
    const text = screen.getByText('Transfer')
    const subtext = screen.getByText('Subtext')

    expect(stepNumber).toHaveStyle(`color: ${COLORS.white}`)
    expect(text).toHaveStyle(`color: ${COLORS.white}`)
    expect(subtext).toHaveStyle(`color: ${COLORS.transparentWhite80}`)
  })

  it('renders the error + nonselected style', () => {
    props = {
      ...props,
      stepNumber: 123,
      text: 'Transfer',
      subtext: 'Subtext',
      selected: false,
      hasError: true,
      openedOverflowMenuId: 'mockStepId',
      setOpenedOverflowMenuId: vi.fn(),
    }
    render(props)
    const stepNumber = screen.getByText('123.')
    const text = screen.getByText('Transfer')
    const subtext = screen.getByText('Subtext')

    expect(stepNumber).toHaveStyle(`color: ${COLORS.red60}`)
    expect(text).toHaveStyle(`color: ${COLORS.red60}`)
    expect(subtext).toHaveStyle(`color: ${COLORS.red60}`)
  })
})
