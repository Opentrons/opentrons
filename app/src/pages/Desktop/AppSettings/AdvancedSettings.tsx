import { css } from 'styled-components'

import {
  Box,
  DIRECTION_COLUMN,
  Flex,
  RadioGroup,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { Divider } from '/app/atoms/structure'
import { i18n } from '/app/i18n'
import {
  ClearUnavailableRobots,
  EnableDevTools,
  OT2AdvancedSettings,
  OverridePathToPython,
  PreventRobotCaching,
  ShowHeaterShakerAttachmentModal,
  ShowLabwareOffsetSnippets,
  U2EInformation,
  UpdatedChannel,
  AdditionalCustomLabwareSourceFolder,
} from '/app/organisms/AdvancedSettings'
import { useFeatureFlag } from '/app/redux/config'

export function AdvancedSettings(): JSX.Element {
  return (
    <>
      <Box paddingX={SPACING.spacing16} paddingY={SPACING.spacing24}>
        <UpdatedChannel />
        <Divider marginY={SPACING.spacing24} />
        <AdditionalCustomLabwareSourceFolder />
        <Divider marginY={SPACING.spacing24} />
        <PreventRobotCaching />
        <Divider marginY={SPACING.spacing24} />
        <ClearUnavailableRobots />
        <Divider marginY={SPACING.spacing24} />
        <ShowHeaterShakerAttachmentModal />
        <Divider marginY={SPACING.spacing24} />
        <ShowLabwareOffsetSnippets />
        <Divider marginY={SPACING.spacing24} />
        <OverridePathToPython />
        <Divider marginY={SPACING.spacing24} />
        <EnableDevTools />
        <Divider marginY={SPACING.spacing24} />
        <OT2AdvancedSettings />
        <Divider marginY={SPACING.spacing24} />
        <U2EInformation />
        {/* TODO(bh, 2024-09-23): remove when localization setting designs implemented */}
        <LocalizationSetting />
      </Box>
    </>
  )
}

function LocalizationSetting(): JSX.Element | null {
  const enableLocalization = useFeatureFlag('enableLocalization')

  return enableLocalization ? (
    <>
      <Divider marginY={SPACING.spacing24} />
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
        <RadioGroup
          useBlueChecked
          css={css`
            ${TYPOGRAPHY.pRegular}
            line-height: ${TYPOGRAPHY.lineHeight20};
          `}
          value={i18n.language}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            void i18n.changeLanguage(event.currentTarget.value)
          }}
          options={[
            { name: 'EN', value: 'en' },
            { name: 'CN', value: 'zh' },
          ]}
        />
      </Flex>
    </>
  ) : null
}
