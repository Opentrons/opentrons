import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  SPACING_3,
  ALIGN_CENTER,
  FONT_SIZE_BODY_2,
  C_DARK_GRAY,
  Flex,
  Text,
  Link,
  SPACING_1,
} from '@opentrons/components'
import { LabwareOffsetSuccessToast } from './LabwareOffsetSuccessToast'
import { RunSetupCard } from './RunSetupCard'
import { MetadataCard } from './MetadataCard'

const feedbackFormLink =
  'https://docs.google.com/forms/d/e/1FAIpQLSd6oSV82IfgzSi5t_FP6n_pB_Y8wPGmAgFHsiiFho9qhxr-UQ/viewform'

export function ProtocolSetup(): JSX.Element {
  const { t } = useTranslation(['protocol_setup'])
  const [showLPCSuccessToast, setShowLPCSuccessToast] = React.useState(true)

  return (
    <>
      {showLPCSuccessToast && (
        <LabwareOffsetSuccessToast
          onCloseClick={() => setShowLPCSuccessToast(false)}
        />
      )}
      <Flex
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_CENTER}
        padding={`${SPACING_1} ${SPACING_3} ${SPACING_3} ${SPACING_3}`}
      >
        <MetadataCard />
        <RunSetupCard />
        <Text
          fontSize={FONT_SIZE_BODY_2}
          paddingTop={SPACING_3}
          color={C_DARK_GRAY}
        >
          {t('protocol_upload_revamp_feedback')}
          <Link
            href={feedbackFormLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            {' '}
            {t('feedback_form_link')}
          </Link>
        </Text>
      </Flex>
    </>
  )
}
