// @flow
import * as React from 'react'
import startCase from 'lodash/startCase'
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
  C_TRANSPARENT,
  FONT_SIZE_BODY_1,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_FLEX_START,
  JUSTIFY_SPACE_BETWEEN,
  TEXT_TRANSFORM_UPPERCASE,
  SIZE_1,
  SIZE_2,
  SPACING_3,
} from '@opentrons/components'
import { i18n } from '../../localization'
import { stepIconsByType } from '../../form-types'
import type { FormData, StepType } from '../../form-types'

type Props = {|
  selectedSteps: Array<FormData>,
  handleExitBatchEdit: () => mixed,
|}

type StepPillProps = {| stepType: StepType, count: number |}

const StepPill = (props: StepPillProps): React.Node => {
  const { count, stepType } = props
  const label = `${startCase(
    i18n.t(`application.stepType.${stepType}`)
  )} (${count})`
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      border={`${BORDER_WIDTH_DEFAULT} ${BORDER_STYLE_SOLID} ${C_SELECTED_DARK}`}
      borderRadius="20px"
      padding="0.5rem"
      marginRight="0.5rem"
      marginBottom="0.5rem"
      key={stepType}
    >
      <Icon name={stepIconsByType[stepType]} width={SIZE_1} />
      <Text fontSize={FONT_SIZE_BODY_1} paddingLeft="0.5rem">
        {label}
      </Text>
    </Flex>
  )
}

export const StepSelectionBannerComponent = (props: Props): React.Node => {
  const { selectedSteps, handleExitBatchEdit } = props
  const numSteps = selectedSteps.length
  const countPerType = selectedSteps.reduce((acc, step) => {
    const { stepType } = step
    const newCount = acc[stepType] ? acc[stepType] + 1 : 1
    return { ...acc, [stepType]: newCount }
  }, {})
  const stepTypes = Object.keys(countPerType).sort()

  return (
    <Flex
      backgroundColor={C_BG_SELECTED}
      padding={SPACING_3}
      color={C_SELECTED_DARK}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
    >
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
      <Flex justifyContent={JUSTIFY_FLEX_START} flexWrap="wrap" flex="1">
        {stepTypes.map(stepType => (
          <StepPill
            count={countPerType[stepType]}
            stepType={stepType}
            key={stepType}
          />
        ))}
        <Box flex="0 1 auto" marginLeft={SPACING_3}>
          <SecondaryBtn
            color={C_SELECTED_DARK}
            backgroundColor={C_TRANSPARENT}
            onClick={handleExitBatchEdit}
          >
            {i18n.t('application.exit_batch_edit')}
          </SecondaryBtn>
        </Box>
      </Flex>
    </Flex>
  )
}
