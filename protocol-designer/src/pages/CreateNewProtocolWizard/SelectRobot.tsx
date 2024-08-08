import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  TYPOGRAPHY,
  Text,
  COLORS,
  BORDERS,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  RESPONSIVENESS,
  DIRECTION_ROW,
  JUSTIFY_FLEX_START,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  JUSTIFY_FLEX_END,
} from '@opentrons/components'
import {
  FLEX_DISPLAY_NAME,
  FLEX_ROBOT_TYPE,
  OT2_DISPLAY_NAME,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'

import type { RobotType } from '@opentrons/shared-data'
import { WizardTileProps } from './types'

const ROBOT_TYPES: RobotType[] = [OT2_ROBOT_TYPE, FLEX_ROBOT_TYPE]

export function SelectRobot(props: WizardTileProps): JSX.Element {
  const { setValue, proceed, watch } = props
  const { t } = useTranslation(['modal', 'shared'])
  const fields = watch('fields')
  const liveRobotType = fields?.robotType ?? OT2_ROBOT_TYPE

  return (
    <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacing32}>
        robot type
      <Flex
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_FLEX_END}
        width="100%"
      >
        <PrimaryButton
          onClick={() => {
            proceed()
          }}
        >
          {t('shared:confirm')}
        </PrimaryButton>
      </Flex>
    </Flex>
  )
}

// const CONTENTS_BY_ROBOT_TYPE: {
//   [robotType in RobotType]: { displayName: string; imageSrc: string }
// } = {
//   [OT2_ROBOT_TYPE]: {
//     displayName: 'OT-2',
//     imageSrc: OT2Image,
//   },
//   [FLEX_ROBOT_TYPE]: {
//     displayName: 'Opentrons Flex',
//     imageSrc: opentronsFlexImage,
//   },
// }
