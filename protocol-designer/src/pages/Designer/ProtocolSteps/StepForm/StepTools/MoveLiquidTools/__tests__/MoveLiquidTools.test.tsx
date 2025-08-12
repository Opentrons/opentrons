import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { getRobotType } from '/protocol-designer/file-data/selectors'
import { getLiquidEntities } from '/protocol-designer/step-forms/selectors'

import { MoveLiquidTools } from '../'
import { FirstStepMoveLiquidTools } from '../FirstStepMoveLiquidTools'
import { LiquidClassesStepTools } from '../LiquidClassesStepTools'
import { SecondStepsMoveLiquidTools } from '../SecondStepsMoveLiquidTools'

import type { ComponentProps } from 'react'
import type { FormData } from '/protocol-designer/form-types'

vi.mock('/protocol-designer/feature-flags/selectors')
vi.mock('/protocol-designer/file-data/selectors')
vi.mock('/protocol-designer/step-forms/selectors')
vi.mock('../FirstStepMoveLiquidTools')
vi.mock('../SecondStepsMoveLiquidTools')
vi.mock('../LiquidClassesStepTools')
vi.mock('../hooks/useAssignLiquidClass')
vi.mock('../hooks/useSupportedLiquidClassOptions')

const render = (props: ComponentProps<typeof MoveLiquidTools>) => {
  return renderWithProviders(<MoveLiquidTools {...props} />)
}

describe('MoveLiquidTools', () => {
  let props: ComponentProps<typeof MoveLiquidTools>

  beforeEach(() => {
    props = {
      toolboxStep: 0,
      propsForFields: {
        liquidClass: { updateValue: vi.fn() },
      } as any,
      formData: {} as FormData,
      tab: 'aspirate',
      setTab: vi.fn(),
      focusHandlers: {} as any,
      showFormErrors: false,
    }
    vi.mocked(getLiquidEntities).mockReturnValue({})
    vi.mocked(getRobotType).mockReturnValue(FLEX_ROBOT_TYPE)

    vi.mocked(FirstStepMoveLiquidTools).mockReturnValue(
      <div>mock FirstStepMoveLiquidTools</div>
    )
    vi.mocked(LiquidClassesStepTools).mockReturnValue(
      <div>mock LiquidClassesStepMoveLiquidTools</div>
    )
    vi.mocked(SecondStepsMoveLiquidTools).mockReturnValue(
      <div>mock SecondStepsMoveLiquidTools</div>
    )
  })

  it('renders FirstStepMoveLiquidTools when toolboxStep is 0', () => {
    render(props)
    screen.getByText('mock FirstStepMoveLiquidTools')
  })

  it('renders LiquidClassesStepTools when toolboxStep is 1 and robot is Flex', () => {
    props.toolboxStep = 1
    render(props)
    screen.getByText('mock LiquidClassesStepMoveLiquidTools')
  })

  it('renders SecondStepsMoveLiquidTools when toolboxStep is 1 and robot is OT-2', () => {
    vi.mocked(getRobotType).mockReturnValue(OT2_ROBOT_TYPE)
    props.toolboxStep = 2
    render(props)
    screen.getByText('mock SecondStepsMoveLiquidTools')
  })
})
