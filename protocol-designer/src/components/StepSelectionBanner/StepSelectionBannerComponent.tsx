import * as React from 'react'
import { useTranslation } from 'react-i18next'
import startCase from 'lodash/startCase'
import { css } from 'styled-components'
import {
  Box,
  Flex,
  Icon,
  SecondaryBtn,
  Text,
  ALIGN_CENTER,
  BORDER_STYLE_SOLID,
  BORDER_WIDTH_DEFAULT,
  C_BG_SELECTED,
  C_DARK_GRAY,
  C_SELECTED_DARK,
  C_WHITE,
  DIRECTION_COLUMN,
  FONT_SIZE_BODY_1,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_FLEX_START,
  JUSTIFY_SPACE_BETWEEN,
  POSITION_STICKY,
  SIZE_2,
  SPACING_3,
  TYPOGRAPHY,
} from '@opentrons/components'
import { CountPerStepType, StepType } from '../../form-types'

interface StepPillProps {
  stepType: StepType
  count: number
}

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

const StepPill = (props: StepPillProps): JSX.Element => {
  const { t } = useTranslation('application')
  const { count, stepType } = props
  const label = `${startCase(t(`stepType.${stepType}`))} (${count})`
  return (
    <Flex css={stepPillStyles} key={stepType}>
      <Text fontSize={FONT_SIZE_BODY_1}>{label}</Text>
    </Flex>
  )
}

export const ExitBatchEditButton = (props: {
  handleExitBatchEdit: StepSelectionBannerProps['handleExitBatchEdit']
}): JSX.Element => {
  const { t } = useTranslation('application')
  return (
    <Box flex="0 1 auto">
      <SecondaryBtn
        color={C_WHITE}
        backgroundColor={C_SELECTED_DARK}
        onClick={props.handleExitBatchEdit}
      >
        {t('exit_batch_edit')}
      </SecondaryBtn>
    </Box>
  )
}
export interface StepSelectionBannerProps {
  countPerStepType: CountPerStepType
  handleExitBatchEdit: () => unknown
}

export const StepSelectionBannerComponent = (
  props: StepSelectionBannerProps
): JSX.Element => {
  const { t } = useTranslation('application')
  const { countPerStepType, handleExitBatchEdit } = props
  const numSteps = Object.keys(countPerStepType).reduce<number>(
    // @ts-expect-error(sa, 2021-6-23): refactor to use Object.entries to preserve type safety
    (acc, stepType) => acc + countPerStepType[stepType as StepType],
    0
  )

  const stepTypes: StepType[] = Object.keys(
    countPerStepType
  ).sort() as StepType[]

  return (
    <Box
      backgroundColor={C_BG_SELECTED}
      padding={SPACING_3}
      color={C_SELECTED_DARK}
      position={POSITION_STICKY}
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
                textTransform={TYPOGRAPHY.textTransformUppercase}
                id="StepSelectionBannerComponent_numberStepsSelected"
              >
                {t('n_steps_selected', { n: numSteps })}
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
                // @ts-expect-error(sa, 2021-6-23): refactor to use Object.entries to preserve type safety
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
