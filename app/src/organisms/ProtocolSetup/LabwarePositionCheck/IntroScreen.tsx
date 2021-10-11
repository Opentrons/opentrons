import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  PrimaryBtn,
  Text,
  Flex,
  Box,
  TEXT_TRANSFORM_UPPERCASE,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  C_BLUE,
  SPACING_2,
  SPACING_3,
  SPACING_4,
  FONT_SIZE_BODY_2,
} from '@opentrons/components'
import { PositionCheckNav } from './PositionCheckNav'
import { DeckMap } from './DeckMap'
import { useIntroInfo } from './hooks'

export const IntroScreen = (props: {
  setCurrentLabwareCheckStep: (stepNumber: number) => void
}): JSX.Element | null => {
  const introInfo = useIntroInfo()
  const { t } = useTranslation(['labware_position_check', 'shared'])

  if (introInfo == null) return null
  const {
    primaryPipetteMount,
    secondaryPipetteMount,
    firstStepLabwareSlot,
    sections,
  } = introInfo

  return (
    <Box margin={SPACING_3}>
      <Text
        as={'h3'}
        textTransform={TEXT_TRANSFORM_UPPERCASE}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
      >
        {t('labware_position_check_overview')}
      </Text>
      <Trans
        t={t}
        i18nKey="position_check_description"
        components={{
          block: <Text fontSize={FONT_SIZE_BODY_2} marginBottom={SPACING_2} />,
        }}
      ></Trans>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} alignItems={ALIGN_CENTER}>
        <PositionCheckNav
          sections={sections}
          primaryPipetteMount={primaryPipetteMount}
          secondaryPipetteMount={secondaryPipetteMount}
        />
        <Box width="60%" padding={SPACING_3}>
          <DeckMap />
        </Box>
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER} marginBottom={SPACING_4}>
        <PrimaryBtn
          title={t('start_position_check', {
            initial_labware_slot: firstStepLabwareSlot,
          })}
          backgroundColor={C_BLUE}
          onClick={() => props.setCurrentLabwareCheckStep(0)}
        >
          {t('start_position_check', {
            initial_labware_slot: firstStepLabwareSlot,
          })}
        </PrimaryBtn>
      </Flex>
    </Box>
  )
}
