// @flow
import * as React from 'react'
import startCase from 'lodash/startCase'
import { css } from 'styled-components'
import {
  Box,
  Text,
  Flex,
  SecondaryBtn,
  Icon,
  ALIGN_CENTER,
  BORDER_STYLE_SOLID,
  BORDER_WIDTH_DEFAULT,
  C_BG_SELECTED,
  C_SELECTED_DARK,
  C_WHITE,
  C_DARK_GRAY,
  FONT_SIZE_BODY_1,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_FLEX_START,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_COLUMN,
  TEXT_TRANSFORM_UPPERCASE,
  SIZE_2,
  SPACING_3,
  POSITION_STICKY,
} from '@opentrons/components'
import { i18n } from '../../localization'
import type { CountPerStepType, StepType } from '../../form-types'

type StepPillProps = {| stepType: StepType, count: number |}

const stepPillStyles = css`
  align-items: ${ALIGN_CENTER};
  border-right: ${BORDER_WIDTH_DEFAULT} ${BORDER_STYLE_SOLID} ${C_DARK_GRAY};
  padding: 0 1rem;
  margin: 0.5rem 0;
  color: ${C_DARK_GRAY};

  &:first-child: {
    padding-left: 0;
  }

  &:last-child {
    border-right: none;
  }
`

const StepPill = (props: StepPillProps): React.Node => {
  const { count, stepType } = props
  const label = `${startCase(
    i18n.t(`application.stepType.${stepType}`)
  )} (${count})`
  return (
    <Flex css={stepPillStyles} key={stepType}>
      <Text fontSize={FONT_SIZE_BODY_1}>{label}</Text>
    </Flex>
  )
}

export const ExitBatchEditButton = (props: {
  handleExitBatchEdit: $PropertyType<
    StepSelectionBannerProps,
    'handleExitBatchEdit'
  >,
}): React.Node => (
  <Box flex="0 1 auto">
    <SecondaryBtn
      color={C_WHITE}
      backgroundColor={C_SELECTED_DARK}
      onClick={props.handleExitBatchEdit}
    >
      {i18n.t('application.exit_batch_edit')}
    </SecondaryBtn>
  </Box>
)

export type StepSelectionBannerProps = {|
  countPerStepType: CountPerStepType,
  handleExitBatchEdit: () => mixed,
|}

export const StepSelectionBannerComponent = (
  props: StepSelectionBannerProps
): React.Node => {
  const { countPerStepType, handleExitBatchEdit } = props
  const numSteps = Object.keys(countPerStepType).reduce<number>(
    (acc, stepType) => acc + countPerStepType[stepType],
    0
  )

  const stepTypes: Array<StepType> = Object.keys(countPerStepType).sort()

  return (
    <Box
      backgroundColor={C_BG_SELECTED}
      padding={SPACING_3}
      color={C_SELECTED_DARK}
      position={POSITION_STICKY}
      border={`2px solid ${C_SELECTED_DARK}`}
    >
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} maxWidth="54.5rem">
        <Flex flexDirection={DIRECTION_COLUMN}>
          <Box flex="0 1 auto">
            <Flex alignItems={ALIGN_CENTER}>
              <Icon name="checkbox-multiple-marked-outline" width={SIZE_2} />
              <Text
                width="10rem"
                marginLeft="0.5rem"
                fontWeight={FONT_WEIGHT_SEMIBOLD}
                textTransform={TEXT_TRANSFORM_UPPERCASE}
              >
                {i18n.t('application.n_steps_selected', { n: numSteps })}
              </Text>
            </Flex>
          </Box>
          <Flex
            justifyContent={JUSTIFY_FLEX_START}
            flexWrap="wrap"
            flex="1"
            paddingLeft="1.5rem"
          >
            {stepTypes.map(stepType => (
              <StepPill
                count={countPerStepType[stepType]}
                stepType={stepType}
                key={stepType}
              />
            ))}
          </Flex>
        </Flex>
        <ExitBatchEditButton handleExitBatchEdit={handleExitBatchEdit} />
      </Flex>
    </Box>
  )
}
