import { when } from 'jest-when'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { useFilterWizardStepsFrom } from '../hooks'
import { getModuleCalibrationSteps } from '../../../organisms/ModuleWizardFlows/useFilteredModuleCalibrationSteps'
import { getGripperWizardSteps } from '../../../organisms/GripperWizardFlows/useFilteredGripperWizardSteps'
import { getPipetteWizardSteps } from '../../../organisms/PipetteWizardFlows/getPipetteWizardSteps'

jest.mock('@opentrons/react-api-client')

const mockUseInstrumentsQuery = useInstrumentsQuery as jest.MockedFunction<
  typeof useInstrumentsQuery
>

const MOCK_MODULE_FLOW_STEPS = getModuleCalibrationSteps()
const MOCK_GRIPPER_FLOW_STEPS = getGripperWizardSteps('ATTACH')
const MOCK_PIPETTE_FLOW_STEPS = getPipetteWizardSteps(
  'ATTACH',
  'left',
  'Single-Channel_and_8-Channel',
  false
)

const MOCK_SUBSYSTEM = 'pipette_left'

const MOCK_INSTRUMENTS_DATA = {
  data: {
    data: [
      {
        instrumentType: 'pipette',
        mount: 'left',
        subsystem: MOCK_SUBSYSTEM,
        ok: true,
        firmwareVersion: 12,
        instrumentName: 'p10_single',
        data: {
          calibratedOffset: {
            last_modified: 'today',
          },
        },
      } as any,
      {
        instrumentType: 'gripper',
        mount: 'extension',
        subsystem: 'gripper',
        ok: true,
        firmwareVersion: 12,
        data: {
          calibratedOffset: {
            last_modified: 'today',
          },
        },
      } as any,
    ],
  },
} as any

describe('useFilterWizardStepsFrom', () => {
  beforeEach(() => {
    when(mockUseInstrumentsQuery).mockReturnValue(MOCK_INSTRUMENTS_DATA)
  })

  it('does not return the firmware step if a subsystem firware update is not required', () => {
    const moduleResult = useFilterWizardStepsFrom(
      MOCK_MODULE_FLOW_STEPS,
      MOCK_SUBSYSTEM
    )
    const gripperResult = useFilterWizardStepsFrom(
      MOCK_GRIPPER_FLOW_STEPS,
      'gripper'
    )
    const pipetteResult = useFilterWizardStepsFrom(
      MOCK_PIPETTE_FLOW_STEPS,
      MOCK_SUBSYSTEM
    )

    expect(moduleResult.some(step => step.section === 'FIRMWARE_UPDATE')).toBe(
      false
    )
    expect(gripperResult.some(step => step.section === 'FIRMWARE_UPDATE')).toBe(
      false
    )
    expect(pipetteResult.some(step => step.section === 'FIRMWARE_UPDATE')).toBe(
      false
    )
  })
  it('returns all flow steps if a subsystem firmware update is required', () => {
    const NO_FIRMWARE_UPDATE = {
      ...MOCK_INSTRUMENTS_DATA,
      data: {
        ...MOCK_INSTRUMENTS_DATA.data,
        data: MOCK_INSTRUMENTS_DATA.data.data.map((item: any) => ({
          ...item,
          ok: false,
        })),
      },
    }

    when(mockUseInstrumentsQuery).mockReturnValue(NO_FIRMWARE_UPDATE)
    const moduleResult = useFilterWizardStepsFrom(
      MOCK_MODULE_FLOW_STEPS,
      MOCK_SUBSYSTEM
    )
    const gripperResult = useFilterWizardStepsFrom(
      MOCK_GRIPPER_FLOW_STEPS,
      'gripper'
    )
    const pipetteResult = useFilterWizardStepsFrom(
      MOCK_PIPETTE_FLOW_STEPS,
      MOCK_SUBSYSTEM
    )

    expect(moduleResult.length).toEqual(MOCK_MODULE_FLOW_STEPS.length)
    expect(gripperResult.length).toEqual(MOCK_GRIPPER_FLOW_STEPS.length)
    expect(pipetteResult.length).toEqual(MOCK_PIPETTE_FLOW_STEPS.length)
  })
})
