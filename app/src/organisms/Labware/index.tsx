import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Flex,
  Text,
  Link,
  SPACING,
  COLORS,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  Icon,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { SecondaryButton } from '../../atoms/Buttons'
import { Toast } from '../../atoms/Toast'

import { LabwareCard } from './LabwareCard'
import { AddCustomLabware } from './AddCustomLabware'
import { useGetAllLabware, useLabwareFailure, useNewLabwareName } from './hooks'

const LABWARE_CREATOR_HREF = 'https://labware.opentrons.com/create/'

export function Labware(): JSX.Element {
  const { t } = useTranslation('labware_landing')

  const labware = useGetAllLabware()
  const { labwareFailureMessage, clearLabwareFailure } = useLabwareFailure()
  const { newLabwareName, clearLabwareName } = useNewLabwareName()
  const [showAddLabwareSlideout, setShowAddLabwareSlideout] = React.useState(
    false
  )
  const [showSuccessToast, setShowSuccessToast] = React.useState(false)
  const [showFailureToast, setShowFailureToast] = React.useState(false)
  React.useEffect(() => {
    if (labwareFailureMessage != null) {
      setShowAddLabwareSlideout(false)
      setShowFailureToast(true)
    } else if (newLabwareName != null) {
      setShowAddLabwareSlideout(false)
      setShowSuccessToast(true)
    }
  }, [labwareFailureMessage, newLabwareName])

  return (
    <>
      <Box paddingX={SPACING.spacing4} paddingY={SPACING.spacing5}>
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_CENTER}
          paddingBottom={SPACING.spacing5}
        >
          <StyledText
            as="h1"
            textTransform={TYPOGRAPHY.textTransformCapitalize}
          >
            {t('labware')}
          </StyledText>
          <SecondaryButton onClick={() => setShowAddLabwareSlideout(true)}>
            {t('import')}
          </SecondaryButton>
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing2}>
          {labware.map(labware => (
            <LabwareCard
              key={labware.definition.metadata.displayName}
              labware={labware}
            />
          ))}
        </Flex>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing3}
          alignItems={ALIGN_CENTER}
          marginTop={SPACING.spacing6}
        >
          <Text color={COLORS.black} css={TYPOGRAPHY.pSemiBold}>
            {t('create_new_def')}
          </Text>
          <Text css={TYPOGRAPHY.h6SemiBold} color={COLORS.darkGreyEnabled}>
            <Link href={LABWARE_CREATOR_HREF} color={COLORS.darkGreyEnabled}>
              {t('open_labware_creator')}{' '}
              <Icon name="open-in-new" height="10px"></Icon>
            </Link>
          </Text>
        </Flex>
      </Box>
      {showAddLabwareSlideout && (
        <AddCustomLabware
          isExpanded={showAddLabwareSlideout}
          onCloseClick={() => setShowAddLabwareSlideout(false)}
          onSuccess={() => setShowSuccessToast(true)}
          onFailure={() => setShowFailureToast(true)}
        />
      )}
      {showSuccessToast && newLabwareName != null && (
        <Toast
          message={t('imported', { filename: newLabwareName })}
          type="success"
          closeButton
          onClose={() => {
            setShowSuccessToast(false)
            clearLabwareName()
          }}
        />
      )}
      {showFailureToast && labwareFailureMessage != null && (
        <Toast
          message={labwareFailureMessage}
          type="error"
          closeButton
          onClose={() => {
            setShowFailureToast(false)
            clearLabwareFailure()
          }}
        />
      )}
    </>
  )
}
