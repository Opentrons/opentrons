import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { capitalize } from 'lodash'
import {
  ALIGN_CENTER,
  Box,
  C_DARK_GRAY,
  C_DISABLED,
  C_NEAR_WHITE,
  C_WHITE,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  FONT_SIZE_CAPTION,
  JUSTIFY_CENTER,
  JUSTIFY_FLEX_START,
  JUSTIFY_SPACE_BETWEEN,
  SIZE_1,
  SPACING_2,
  SPACING_4,
  SPACING_5,
  Text,
  TEXT_ALIGN_CENTER,
} from '@opentrons/components'
import { LabwarePositionCheckStepDetail } from './LabwarePositionCheckStepDetail'
import type { LabwarePositionCheckStep, Section } from './types'
import { useIntroInfo } from './hooks'

interface GenericStepScreenProps {
  selectedStep: LabwarePositionCheckStep
  setCurrentLabwareCheckStep: (stepNumber: number) => void
  activeSection: Section
  sections: Section[]
}
export function GenericStepScreen(
  props: GenericStepScreenProps
): JSX.Element | null {
  const { activeSection, sections } = props
  const { t } = useTranslation('labware_position_check')
  const introInfo = useIntroInfo()
  if (introInfo == null) return null
  const { primaryPipetteMount, secondaryPipetteMount } = introInfo
  return (
    <React.Fragment>
      <Flex>
        <Box
          fontSize={FONT_SIZE_CAPTION}
          width="45%"
          height="20%"
          marginLeft={SPACING_5}
          marginTop={SPACING_5}
          boxShadow="1px 1px 1px rgba(0, 0, 0, 0.25)"
          borderRadius="4px"
          backgroundColor={C_NEAR_WHITE}
        >
          {sections.map((section, index) => (
            <Flex key={index} padding={SPACING_2} alignItems={ALIGN_CENTER}>
              <Box
                width={SIZE_1}
                height={SIZE_1}
                lineHeight={SIZE_1}
                backgroundColor={
                  section === activeSection ? '#00c3e6' : C_DISABLED
                }
                color={C_WHITE}
                borderRadius="50%"
                marginRight={SPACING_2}
                textAlign={TEXT_ALIGN_CENTER}
              >
                {index + 1}
              </Box>
              <Box maxWidth="85%">
                <Text
                  color={section === activeSection ? '#00c3e6' : C_DISABLED}
                >
                  {t(`${section.toLowerCase()}_section`, {
                    primary_mount: capitalize(primaryPipetteMount),
                    secondary_mount: capitalize(secondaryPipetteMount),
                  })}
                </Text>
              </Box>
            </Flex>
          ))}
        </Box>
        <Flex>
          <LabwarePositionCheckStepDetail selectedStep={props.selectedStep} />
        </Flex>
      </Flex>
    </React.Fragment>
  )
}
