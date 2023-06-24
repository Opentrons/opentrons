import * as React from 'react'
import { useTranslation } from 'react-i18next'
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
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import { css } from 'styled-components'
import opentronsFlexImage from '../../../images/OpentronsFlex.png'
import OT2Image from '../../../images/OT2.png'

import type { RobotType } from '@opentrons/shared-data'
import type { WizardTileProps } from './types'
import { HandleEnter } from './HandleEnter'

const ROBOT_TYPES: RobotType[] = [OT2_ROBOT_TYPE, FLEX_ROBOT_TYPE]

export function RobotTypeTile(props: WizardTileProps): JSX.Element {
  const { i18n, t } = useTranslation()
  const { values, setFieldValue, proceed } = props
  return (
    <HandleEnter onEnter={proceed}>
      <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacing32}>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          height="26rem"
          gridGap={SPACING.spacing32}
        >
          <Text as="h2">
            {i18n.t('modal.create_file_wizard.choose_robot_type')}
          </Text>

          <Flex
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            gridGap={SPACING.spacing8}
          >
            {ROBOT_TYPES.map(robotType => (
              <RobotTypeOption
                key={robotType}
                isSelected={values.fields.robotType === robotType}
                onClick={() => {
                  setFieldValue('fields.robotType', robotType)
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
          <PrimaryButton onClick={() => proceed()}>
            {i18n.format(t('shared.next'), 'capitalize')}
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
    displayName: 'OT2',
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
  return (
    <Flex
      flex="1 0 auto"
      onClick={onClick}
      css={isSelected ? SELECTED_OPTIONS_STYLE : UNSELECTED_OPTIONS_STYLE}
    >
      <img
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
  border: 1px solid ${COLORS.medGreyEnabled};
  border-radius: ${BORDERS.radiusSoftCorners};
  height: 14.5625rem;
  width: 14.5625rem;
  cursor: pointer;
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_CENTER};
  align-items: ${ALIGN_CENTER};
  grid-gap: ${SPACING.spacing8}

  &:hover {
    border: 1px solid ${COLORS.medGreyHover};
  }

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    flex-direction: ${DIRECTION_ROW};
    justify-content: ${JUSTIFY_FLEX_START};
    background-color: ${COLORS.mediumBlueEnabled};
    border-width: 0; 
    border-radius: ${BORDERS.borderRadiusSize4};
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
  border: 1px solid ${COLORS.blueEnabled};
  background-color: ${COLORS.lightBlue};

  &:hover {
    border: 1px solid ${COLORS.blueEnabled};
    background-color: ${COLORS.lightBlue};
  }

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    border-width: 0px;
    background-color: ${COLORS.blueEnabled};
    color: ${COLORS.white};

    &:hover {
      border-width: 0px;
      background-color: ${COLORS.blueEnabled};
    }
  }
`
