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
import opentronsFlexImage from '../../../images/OpentronsFlex.png'
import OT2Image from '../../../images/OT2.png'
import { HandleEnter } from './HandleEnter'

import type { RobotType } from '@opentrons/shared-data'
import type { WizardTileProps } from './types'

const ROBOT_TYPES: RobotType[] = [OT2_ROBOT_TYPE, FLEX_ROBOT_TYPE]

export function RobotTypeTile(props: WizardTileProps): JSX.Element {
  const { setValue, proceed, watch } = props
  const { t } = useTranslation(['modal', 'application'])
  const fields = watch('fields')
  const liveRobotType = fields?.robotType ?? OT2_ROBOT_TYPE

  return (
    <HandleEnter onEnter={proceed}>
      <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacing32}>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          height="26rem"
          gridGap={SPACING.spacing32}
        >
          <Text as="h2">{t('modal:choose_robot_type')}</Text>

          <Flex
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            gridGap={SPACING.spacing8}
          >
            {ROBOT_TYPES.map(robotType => (
              <RobotTypeOption
                key={robotType}
                isSelected={liveRobotType === robotType}
                onClick={() => {
                  setValue('fields.robotType', robotType)
                }}
                robotType={robotType}
              />
            ))}
          </Flex>
        </Flex>
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
            {t('application:next')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </HandleEnter>
  )
}

const CONTENTS_BY_ROBOT_TYPE: {
  [robotType in RobotType]: { displayName: string; imageSrc: string }
} = {
  [OT2_ROBOT_TYPE]: {
    displayName: 'OT-2',
    imageSrc: OT2Image,
  },
  [FLEX_ROBOT_TYPE]: {
    displayName: 'Opentrons Flex',
    imageSrc: opentronsFlexImage,
  },
}

interface RobotTypeOptionProps {
  isSelected: boolean
  onClick: () => void
  robotType: RobotType
}
function RobotTypeOption(props: RobotTypeOptionProps): JSX.Element {
  const { isSelected, onClick, robotType } = props
  const { displayName, imageSrc } = CONTENTS_BY_ROBOT_TYPE[robotType]
  const robotDisplayName =
    robotType === FLEX_ROBOT_TYPE ? FLEX_DISPLAY_NAME : OT2_DISPLAY_NAME
  return (
    <Flex
      aria-label={`${robotDisplayName} option`}
      flex="1 0 auto"
      onClick={onClick}
      css={isSelected ? SELECTED_OPTIONS_STYLE : UNSELECTED_OPTIONS_STYLE}
    >
      <img
        aria-label={`${robotDisplayName} image`}
        src={imageSrc}
        css={css`
          max-width: 11rem;
        `}
      />
      <Text
        as="h3"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        textAlign={TYPOGRAPHY.textAlignCenter}
      >
        {displayName}
      </Text>
    </Flex>
  )
}

const UNSELECTED_OPTIONS_STYLE = css`
  background-color: ${COLORS.white};
  border: 1px solid ${COLORS.grey30};
  border-radius: ${BORDERS.borderRadius8};
  height: 14.5625rem;
  width: 14.5625rem;
  cursor: pointer;
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_CENTER};
  align-items: ${ALIGN_CENTER};
  grid-gap: ${SPACING.spacing8}

  &:hover {
    border: 1px solid ${COLORS.grey60};
  }

  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
    flex-direction: ${DIRECTION_ROW};
    justify-content: ${JUSTIFY_FLEX_START};
    background-color: ${COLORS.blue35};
    border-width: 0;
    border-radius: ${BORDERS.borderRadius16};
    padding: ${SPACING.spacing24};
    height: 5.25rem;
    width: 57.8125rem;

    &:hover {
      border-width: 0px;
    }
  }
`
const SELECTED_OPTIONS_STYLE = css`
  ${UNSELECTED_OPTIONS_STYLE}
  border: 1px solid ${COLORS.blue50};
  background-color: ${COLORS.blue10};

  &:hover {
    border: 1px solid ${COLORS.blue50};
    background-color: ${COLORS.blue10};
  }

  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
    border-width: 0px;
    background-color: ${COLORS.blue50};
    color: ${COLORS.white};

    &:hover {
      border-width: 0px;
      background-color: ${COLORS.blue50};
    }
  }
`
