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
  SIZE_1,
  SIZE_2,
  SPACING_3,
  SPACING_4,
  POSITION_STICKY,
} from '@opentrons/components'
import { i18n } from '../../localization'
import { stepIconsByType } from '../../form-types'
import type { FormData, StepType } from '../../form-types'

type Props = {|
  selectedSteps: Array<FormData>,
  handleExitBatchEdit: () => mixed,
|}

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
      <Icon name={stepIconsByType[stepType]} width={SIZE_1} />
      <Text fontSize={FONT_SIZE_BODY_1} paddingLeft="0.5rem">
        {label}
      </Text>
    </Flex>
  )
}

export const ExitBatchEditButton = (props: {
  handleExitBatchEdit: $PropertyType<Props, 'handleExitBatchEdit'>,
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

export const StepSelectionBannerComponent = (props: Props): React.Node => {
  const { selectedSteps, handleExitBatchEdit } = props
  const numSteps = selectedSteps.length
  const countPerType = selectedSteps.reduce((acc, step) => {
    const { stepType } = step
    const newCount = acc[stepType] ? acc[stepType] + 1 : 1
    acc[stepType] = newCount
    return acc
  }, {})
  // $FlowFixMe(IL, 2020-02-03): Flow can't figure out that the keys are StepType rather than string
  const stepTypes: Array<StepType> = Object.keys(countPerType).sort()

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
            paddingLeft={SPACING_4}
          >
            {stepTypes.map(stepType => (
              <StepPill
                count={countPerType[stepType]}
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
