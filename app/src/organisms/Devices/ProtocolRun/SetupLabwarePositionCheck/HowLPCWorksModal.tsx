import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  Icon,
  Link,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
  ALIGN_FLEX_END,
  PrimaryButton,
  SPACING,
} from '@opentrons/components'
import { Portal } from '../../../../App/portal'
import { LegacyModal } from '../../../../molecules/LegacyModal'
import { StyledText } from '../../../../atoms/text'

const ROBOT_CAL_HELP_ARTICLE =
  'https://support.opentrons.com/s/article/How-positional-calibration-works-on-the-OT-2'
const OFFSET_DATA_HELP_ARTICLE =
  'https://support.opentrons.com/s/article/How-Labware-Offsets-work-on-the-OT-2'
interface HowLPCWorksModalProps {
  onCloseClick: () => unknown
}

export const HowLPCWorksModal = (props: HowLPCWorksModalProps): JSX.Element => {
  const { t } = useTranslation(['protocol_setup', 'shared'])
  return (
    <Portal level="top">
      <LegacyModal
        title={t('how_offset_data_works')}
        onClose={props.onCloseClick}
        width="31.25rem"
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText as="p" marginBottom={SPACING.spacing16}>
            {t('what_labware_offset_is')}
          </StyledText>
          <Link
            css={TYPOGRAPHY.linkPSemiBold}
            href={OFFSET_DATA_HELP_ARTICLE}
            id="HowLPCWorksModal_helpArticleLink2"
            external
            marginBottom={SPACING.spacing16}
          >
            {t('learn_more_about_offset_data')}
            <Icon
              name="open-in-new"
              marginLeft={SPACING.spacing4}
              size="0.5rem"
            />
          </Link>
          <StyledText as="p" marginBottom={SPACING.spacing16}>
            {t('why_use_lpc')}
          </StyledText>
          <Link
            external
            css={TYPOGRAPHY.linkPSemiBold}
            href={ROBOT_CAL_HELP_ARTICLE}
            id="HowLPCWorksModal_helpArticleLink1"
            marginBottom={SPACING.spacing16}
          >
            {t('learn_more_about_robot_cal_offset')}
            <Icon
              name="open-in-new"
              marginLeft={SPACING.spacing4}
              size="0.5rem"
            />
          </Link>
          <PrimaryButton
            onClick={props.onCloseClick}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            alignSelf={ALIGN_FLEX_END}
            id="LabwareSetupModal_closeButton"
          >
            {t('shared:close')}
          </PrimaryButton>
        </Flex>
      </LegacyModal>
    </Portal>
  )
}
