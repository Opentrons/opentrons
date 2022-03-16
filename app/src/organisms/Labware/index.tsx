import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Flex,
  SPACING,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { SecondaryButton } from '../../atoms/Buttons'
import { Toast } from '../../atoms/Toast'
import {
  getAddLabwareFailure,
  clearAddCustomLabwareFailure,
  getAddNewLabwareName,
  clearNewLabwareName,
} from '../../redux/custom-labware'
import { LabwareCard } from './LabwareCard'
import { AddCustomLabware } from './AddCustomLabware'
import { useGetAllLabware } from './hooks'
import type { Dispatch } from '../../redux/types'
import type { FailedLabwareFile } from '../../redux/custom-labware/types'

export function Labware(): JSX.Element {
  const { t } = useTranslation('labware_landing')
  const dispatch = useDispatch<Dispatch>()

  const labware = useGetAllLabware()
  const labwareFailure = useSelector(getAddLabwareFailure)
  const labwareSuccess = useSelector(getAddNewLabwareName).filename
  const [showAddLabwareSlideout, setShowAddLabwareSlideout] = React.useState(
    false
  )
  const [showSuccessToast, setShowSuccessToast] = React.useState(false)
  const [showFailureToast, setShowFailureToast] = React.useState(false)
  React.useEffect(() => {
    if (labwareFailure.file != null || labwareFailure.errorMessage != null) {
      setShowAddLabwareSlideout(false)
      setShowFailureToast(true)
    } else if (labwareSuccess != null) {
      setShowAddLabwareSlideout(false)
      setShowSuccessToast(true)
    }
  }, [labwareFailure, labwareSuccess])

  const getMessageFromLabwareFailure = (
    failedFile: FailedLabwareFile | null
  ): string => {
    let errorMessage = t('unable_to_upload')
    if (failedFile?.type === 'INVALID_LABWARE_FILE') {
      errorMessage = t('invalid_labware_def')
    } else if (failedFile?.type === 'DUPLICATE_LABWARE_FILE') {
      errorMessage = t('duplicate_labware_def')
    } else if (failedFile?.type === 'OPENTRONS_LABWARE_FILE') {
      errorMessage = t('opentrons_labware_def')
    }
    return failedFile != null
      ? `${t('error_importing_file', {
          filename: failedFile.filename,
        })} ${errorMessage}`
      : errorMessage
  }

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
      </Box>
      {showAddLabwareSlideout && (
        <AddCustomLabware
          isExpanded={showAddLabwareSlideout}
          onCloseClick={() => setShowAddLabwareSlideout(false)}
          onSuccess={() => setShowSuccessToast(true)}
          onFailure={() => setShowFailureToast(true)}
        />
      )}
      {showSuccessToast && labwareSuccess != null && (
        <Toast
          message={t('imported', { filename: labwareSuccess })}
          type="success"
          closeButton
          onClose={() => {
            setShowSuccessToast(false)
            dispatch(clearNewLabwareName())
          }}
        />
      )}
      {showFailureToast && labwareFailure != null && (
        <Toast
          message={getMessageFromLabwareFailure(labwareFailure.file)}
          type="error"
          closeButton
          onClose={() => {
            setShowFailureToast(false)
            dispatch(clearAddCustomLabwareFailure())
          }}
        />
      )}
    </>
  )
}
