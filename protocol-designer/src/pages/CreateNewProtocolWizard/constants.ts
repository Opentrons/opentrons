import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import type { RobotType } from '@opentrons/shared-data'
import type { Gen, PipetteType, PipetteVolumes } from './types'

export const PIPETTE_GENS: Gen[] = ['GEN1', 'GEN2']

export const PIPETTE_TYPES: Record<
  RobotType,
  {
    label: string
    value: PipetteType
  }[]
> = {
  [OT2_ROBOT_TYPE]: [
    {
      label: 'one_channel',
      value: 'single',
    },
    {
      label: 'eight_channel',
      value: 'multi',
    },
  ],
  [FLEX_ROBOT_TYPE]: [
    {
      label: 'one_channel',
      value: 'single',
    },
    {
      label: 'eight_channel',
      value: 'multi',
    },
    {
      label: 'ninety_six_channel',
      value: '96',
    },
  ],
}

export const PIPETTE_VOLUMES: PipetteVolumes = {
  [FLEX_ROBOT_TYPE]: [
    {
      single: [
        { label: '50', value: 'p50' },
        { label: '1000', value: 'p1000' },
      ],
      multi: [
        { label: '50', value: 'p50' },
        { label: '1000', value: 'p1000' },
      ],
      '96': [{ label: '1000', value: 'p1000' }],
    },
  ],
  [OT2_ROBOT_TYPE]: [
    {
      GEN1: [
        {
          single: [
            { label: '10', value: 'p10' },
            { label: '50', value: 'p50' },
            { label: '300', value: 'p300' },
            { label: '1000', value: 'p1000' },
          ],
          multi: [
            { label: '10', value: 'p10' },
            { label: '50', value: 'p50' },
            { label: '300', value: 'p300' },
          ],
          '96': [],
        },
      ],
      GEN2: [
        {
          single: [
            { label: '20', value: 'p20' },
            { label: '300', value: 'p300' },
            { label: '1000', value: 'p1000' },
          ],
          multi: [
            { label: '20', value: 'p20' },
            { label: '300', value: 'p300' },
          ],
          '96': [],
        },
      ],
    },
  ],
}
