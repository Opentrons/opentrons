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
  AlertItem,
  SPACING_1,
  SPACING_2,
} from '@opentrons/components'
import { RunSetupCard } from './RunSetupCard'
import { MetadataCard } from './MetadataCard'

const feedbackFormLink =
  'https://docs.google.com/forms/d/e/1FAIpQLSd6oSV82IfgzSi5t_FP6n_pB_Y8wPGmAgFHsiiFho9qhxr-UQ/viewform'

export function ProtocolSetup(): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const [dismissed, setDismissed] = React.useState(false)
  return (
    <>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={`${SPACING_1} ${SPACING_2} ${SPACING_1} ${SPACING_2}`}
      >
        {!dismissed && (
          <AlertItem
            type="success"
            onCloseClick={() => setDismissed(true)}
            title={t('labware_positon_check_complete_toast', {
              num_offsets: 2, //  TODO wire up num_offsets!
            })}
          />
        )}
      </Flex>
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
          <Link href={feedbackFormLink}> {t('feedback_form_link')}</Link>
        </Text>
      </Flex>
    </>
  )
}
