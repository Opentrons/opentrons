import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  InputField,
  SIZE_AUTO,
  SPACING,
  Text,
  TYPOGRAPHY,
} from '@opentrons/components'
import { RPM } from '@opentrons/shared-data'
import { HeaterShakerModuleCard } from './HeaterShakerModuleCard'
import { TertiaryButton } from '../../../atoms/Buttons'
import { CollapsibleStep } from '../../ProtocolSetup/RunSetupCard/CollapsibleStep'
import { Divider } from '../../../atoms/structure'

interface TestShakeProps {
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>
}

export function TestShake(props: TestShakeProps): JSX.Element {
  const { setCurrentPage } = props
  const { t } = useTranslation('heater_shaker')

  const [isExpanded, setExpanded] = React.useState(false)

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Text
        color={COLORS.darkBlack}
        fontSize={TYPOGRAPHY.fontSizeH2}
        fontWeight={700}
      >
        {t('step_4_of_4')}
      </Text>
      <Flex
        marginTop={SPACING.spacing3}
        marginBottom={SPACING.spacing4}
        backgroundColor={COLORS.background}
        paddingTop={SPACING.spacing4}
        paddingLeft={SPACING.spacing4}
        flexDirection={DIRECTION_ROW}
        data-testid={'test_shake_banner_info'}
      >
        <Flex
          size={SPACING.spacing6}
          color={COLORS.darkGreyEnabled}
          paddingBottom={SPACING.spacing4}
        >
          <Icon name="information" aria-label="information" />
        </Flex>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          paddingLeft={SPACING.spacing3}
          fontSize={TYPOGRAPHY.fontSizeP}
          paddingBottom={SPACING.spacing4}
        >
          <Text fontWeight={TYPOGRAPHY.fontWeightRegular}>
            {/* TODO(sh, 2022-02-22): Dynamically render this text if a labware/protocol exists */}
            {t('test_shake_banner_information')}
          </Text>
        </Flex>
      </Flex>
      <Flex
        alignSelf={ALIGN_CENTER}
        flexDirection={DIRECTION_COLUMN}
        fontSize={TYPOGRAPHY.fontSizeCaption}
      >
        <HeaterShakerModuleCard />
        <TertiaryButton marginLeft={SIZE_AUTO} marginTop={SPACING.spacing4}>
          {t('open_labware_latch')}
        </TertiaryButton>
        <Flex
          flexDirection={DIRECTION_ROW}
          marginY={SPACING.spacingL}
          alignItems={ALIGN_FLEX_START}
        >
          <Flex flexDirection={DIRECTION_COLUMN} maxWidth={'6.25rem'}>
            <Text fontSize={TYPOGRAPHY.fontSizeCaption}>
              {t('set_shake_speed')}
            </Text>
            {/* TODO(sh, 2022-02-22): Wire up input when end points are updated */}
            <InputField units={RPM} value={'1000'} readOnly />
            <Text fontSize={TYPOGRAPHY.fontSizeCaption}>
              {'{min} - {max} RPM'}
            </Text>
          </Flex>
          <TertiaryButton
            fontSize={TYPOGRAPHY.fontSizeCaption}
            marginLeft={SIZE_AUTO}
            marginTop={SPACING.spacing3}
          >
            {t('start_shaking')}
          </TertiaryButton>
        </Flex>
      </Flex>
      <Divider marginY={SPACING.spacing4} />
      <CollapsibleStep
        expanded={isExpanded}
        title={t('troubleshooting')}
        toggleExpanded={() => setExpanded(!isExpanded)}
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          alignItems={ALIGN_FLEX_START}
          marginY={SPACING.spacing6}
        >
          <Text width={'22rem'}>{t('troubleshoot_step1_description')}</Text>
          <TertiaryButton
            fontSize={TYPOGRAPHY.fontSizeCaption}
            marginLeft={SIZE_AUTO}
            onClick={() => setCurrentPage(2)}
          >
            {t('go_to_step_1')}
          </TertiaryButton>
        </Flex>
        <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_FLEX_START}>
          <Text width={'22rem'}>{t('troubleshoot_step2_description')}</Text>
          <TertiaryButton
            fontSize={TYPOGRAPHY.fontSizeCaption}
            marginLeft={SIZE_AUTO}
            onClick={() => setCurrentPage(3)}
          >
            {t('go_to_step_2')}
          </TertiaryButton>
        </Flex>
      </CollapsibleStep>
      <Divider marginTop={SPACING.spacing4} marginBottom={SPACING.spacingXL} />
    </Flex>
  )
}
