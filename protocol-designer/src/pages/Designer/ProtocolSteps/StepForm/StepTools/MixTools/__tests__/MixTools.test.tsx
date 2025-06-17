import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import {
  fixture96Plate,
  FLEX_ROBOT_TYPE,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'

import { MixTools } from '..'
import { renderWithProviders } from '../../../../../../../__testing-utils__'
import {
  getEnablePartialTipSupport,
  getEnableReturnTip,
} from '../../../../../../../feature-flags/selectors'
import { getRobotType } from '../../../../../../../file-data/selectors'
import {
  getLabwareEntities,
  getPipetteEntities,
} from '../../../../../../../step-forms/selectors'
import { getFormErrorsMappedToField } from '../../../utils'
import { LiquidClassesStepTools } from '../../MoveLiquidTools/LiquidClassesStepTools'
import { FirstStepMixTools } from '../FirstStepMixTools'
import { SecondStepMixTools } from '../SecondStepMixTools'

import type { ComponentProps } from 'react'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { FormData } from '../../../../../../../form-types'

vi.mock('../../../../../../../step-forms/selectors')
vi.mock('../../../../../../../feature-flags/selectors')
vi.mock('../../../../../../../file-data/selectors')
vi.mock('../../../utils')
vi.mock('../FirstStepMixTools')
vi.mock('../SecondStepMixTools')
vi.mock('../../MoveLiquidTools/LiquidClassesStepTools')
vi.mock('../../MoveLiquidTools/hooks')

const labwareId = 'mockLabwareId'
const pipetteId = 'mockPipetteId'

const render = (props: ComponentProps<typeof MixTools>) => {
  return renderWithProviders(<MixTools {...props} />)
}

describe('MixToolFirstStep', () => {
  let props: ComponentProps<typeof MixTools>

  beforeEach(() => {
    props = {
      propsForFields: {
        liquidClass: { updateValue: vi.fn() },
      } as any,
      formData: {} as FormData,
      toolboxStep: 0,
      tab: 'aspirate',
      setTab: vi.fn(),
      setShowFormErrors: vi.fn(),
    }
    vi.mocked(getLabwareEntities).mockReturnValue({
      labwareId: {
        id: labwareId,
        labwareDefURI: 'mockUri',
        def: fixture96Plate as LabwareDefinition2,
        pythonName: 'mockPythonName',
      },
    })
    vi.mocked(getPipetteEntities).mockReturnValue({
      [pipetteId]: {
        name: 'p50_single_flex',
        spec: {} as any,
        id: pipetteId,
        tiprackLabwareDef: [],
        tiprackDefURI: ['mockDefURI1', 'mockDefURI2'],
        pythonName: 'mockPythonName',
      },
    })
    vi.mocked(getEnableReturnTip).mockReturnValue(false)
    vi.mocked(getEnablePartialTipSupport).mockReturnValue(false)
    vi.mocked(getFormErrorsMappedToField).mockReturnValue({})
    vi.mocked(FirstStepMixTools).mockReturnValue(
      <div>mock FirstStepMixTools</div>
    )
    vi.mocked(SecondStepMixTools).mockReturnValue(
      <div>mock SecondStepMixTools</div>
    )
    vi.mocked(LiquidClassesStepTools).mockReturnValue(
      <div>mock LiquidClassesStepTools</div>
    )
    vi.mocked(getRobotType).mockReturnValue(FLEX_ROBOT_TYPE)
  })

  it('renders FirstStepMixTools when toolboxStep is 0', () => {
    render(props)
    screen.getByText('mock FirstStepMixTools')
  })

  it('renders LiquidClassesStepTools when toolboxStep is 1 and robot is Flex', () => {
    props.toolboxStep = 1
    render(props)
    screen.getByText('mock LiquidClassesStepTools')
  })

  it('renders SecondStepMixTools when toolboxStep is 1 and robot is OT-2', () => {
    props.toolboxStep = 2
    vi.mocked(getRobotType).mockReturnValue(OT2_ROBOT_TYPE)
    render(props)
    screen.getByText('mock SecondStepMixTools')
  })
})
