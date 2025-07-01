import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import {
  COLORS,
  DIRECTION_COLUMN,
  EmptySelectorButton,
  Flex,
  InfoScreen,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { ControlledAddTextAreaFields } from '../../molecules/ControlledAddTextAreaFields'
import { ControlledLabwareListItems } from '../../molecules/ControlledLabwareListItems'
import { LabwareModal } from '../LabwareModal'

export interface DisplayLabware {
  labwareURI: string
  count: number
}

export const LABWARES_FIELD_NAME = 'labwares'
export const LIQUIDS_FIELD_NAME = 'liquids'

export function LabwareLiquidsSection(): JSX.Element | null {
  const { t } = useTranslation('create_protocol')
  const { setValue, watch, trigger } = useFormContext()
  const [displayLabwareModal, setDisplayLabwareModal] = useState(false)

  const labwares: DisplayLabware[] = watch(LABWARES_FIELD_NAME) ?? []
  const liquids: string[] = watch(LIQUIDS_FIELD_NAME) ?? []

  // trigger form validation on mount for when users come back to this section after moving on
  useEffect(() => {
    void trigger([LABWARES_FIELD_NAME, LIQUIDS_FIELD_NAME])
  })

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      height="100%"
      gap={SPACING.spacing16}
    >
      <StyledText color={COLORS.grey60} desktopStyle="headingSmallRegular">
        {t('labware_section_title')}
      </StyledText>
      <StyledText color={COLORS.grey60} desktopStyle="bodyDefaultRegular">
        {t('labware_section_textbody')}
      </StyledText>

      <Flex justifyContent="flex-start">
        <ButtonWrapper>
          <EmptySelectorButton
            onClick={() => {
              setDisplayLabwareModal(true)
            }}
            text={t('add_opentrons_labware')}
            textAlignment="left"
            iconName="plus"
          />
        </ButtonWrapper>
      </Flex>

      <LabwareModal
        displayLabwareModal={displayLabwareModal}
        setDisplayLabwareModal={setDisplayLabwareModal}
      />

      {labwares.length === 0 && (
        <InfoScreen content={t('no_labwares_added_yet')} />
      )}

      <ControlledLabwareListItems />

      <Flex width="100%" borderBottom={`1px solid ${COLORS.grey50}`} />

      <StyledText color={COLORS.grey60} desktopStyle="headingSmallRegular">
        {t('liquid_section_title')}
      </StyledText>
      <StyledText color={COLORS.grey60} desktopStyle="bodyDefaultRegular">
        {t('liquid_section_textbody')}
      </StyledText>

      <Flex justifyContent="flex-start">
        <ButtonWrapper>
          <EmptySelectorButton
            onClick={() => {
              setValue(LIQUIDS_FIELD_NAME, [...liquids, ''])
            }}
            text={t('add_opentrons_liquid')}
            textAlignment="left"
            iconName="plus"
          />
        </ButtonWrapper>
      </Flex>

      <ControlledAddTextAreaFields
        fieldName={LIQUIDS_FIELD_NAME}
        name={t('liquid').toLowerCase()}
        textAreaHeight="57px"
      />
    </Flex>
  )
}

const ButtonWrapper = styled.div`
  display: inline-block;
  flex-grow: 0;
  flex-shrink: 1;
`
