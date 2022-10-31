import * as React from 'react'
import { useTranslation } from 'react-i18next'
import capitalize from 'lodash/capitalize'
import {
  Flex,
  Box,
  ALIGN_CENTER,
  SIZE_1,
  C_WHITE,
  C_NEAR_WHITE,
  C_DARK_GRAY,
  TEXT_ALIGN_CENTER,
  Text,
  C_DISABLED,
  Icon,
  SPACING,
  COLOR_SUCCESS,
  C_SELECTED_DARK,
  TYPOGRAPHY,
} from '@opentrons/components'
import type { DeprecatedSection } from './types'
interface Props {
  sections: DeprecatedSection[]
  currentSection?: DeprecatedSection
  primaryPipetteMount: string
  secondaryPipetteMount: string
  completedSections?: DeprecatedSection[]
}

/**
 *
 * @deprecated
 */
export function DeprecatedSectionList(props: Props): JSX.Element {
  const {
    currentSection,
    sections,
    primaryPipetteMount,
    secondaryPipetteMount,
    completedSections,
  } = props
  const { t } = useTranslation('labware_position_check')

  return (
    <Box
      fontSize={TYPOGRAPHY.fontSizeCaption}
      padding={SPACING.spacing3}
      width="14rem"
      boxShadow="1px 1px 1px rgba(0, 0, 0, 0.25)"
      borderRadius="4px"
      backgroundColor={C_NEAR_WHITE}
    >
      {sections.map((section, index) => {
        const sectionTextColor =
          completedSections != null && !completedSections.includes(section)
            ? C_DISABLED
            : C_DARK_GRAY
        const isCompleted =
          completedSections != null && completedSections.includes(section)
        let backgroundColor = C_DISABLED
        if (section === currentSection) {
          backgroundColor = C_SELECTED_DARK
        } else if (isCompleted === true) {
          backgroundColor = 'transparent'
        } else {
          backgroundColor = sectionTextColor
        }
        return (
          <Flex
            key={index}
            padding={SPACING.spacing2}
            alignItems={ALIGN_CENTER}
          >
            <Box
              width={SIZE_1}
              height={SIZE_1}
              lineHeight={SIZE_1}
              backgroundColor={backgroundColor}
              color={C_WHITE}
              borderRadius="50%"
              marginRight={SPACING.spacing2}
              textAlign={TEXT_ALIGN_CENTER}
            >
              {isCompleted ? (
                <Icon
                  name="check-circle"
                  width={SIZE_1}
                  height={SIZE_1}
                  lineHeight={SIZE_1}
                  marginRight={SPACING.spacing2}
                  color={COLOR_SUCCESS}
                />
              ) : (
                index + 1
              )}
            </Box>
            <Box maxWidth="85%">
              <Text
                color={
                  section === currentSection
                    ? C_SELECTED_DARK
                    : sectionTextColor
                }
                id={`sectionList_step_${index}`}
              >
                {t(`${section.toLowerCase()}_section`, {
                  primary_mount: capitalize(primaryPipetteMount),
                  secondary_mount: capitalize(secondaryPipetteMount),
                })}
              </Text>
            </Box>
          </Flex>
        )
      })}
    </Box>
  )
}
