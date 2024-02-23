import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'

import {
  ALIGN_CENTER,
  Box,
  COLORS,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  Link,
  SPACING_AUTO,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { TertiaryButton } from '../../atoms/buttons'
import { getPathToPythonOverride, resetConfigValue } from '../../redux/config'
import {
  openPythonInterpreterDirectory,
  changePythonPathOverrideConfig,
} from '../../redux/protocol-analysis'
import {
  useTrackEvent,
  ANALYTICS_CHANGE_PATH_TO_PYTHON_DIRECTORY,
} from '../../redux/analytics'

import type { Dispatch } from '../../redux/types'

export function OverridePathToPython(): JSX.Element {
  const { t } = useTranslation('app_settings')
  const pathToPythonInterpreter = useSelector(getPathToPythonOverride)
  const dispatch = useDispatch<Dispatch>()
  const trackEvent = useTrackEvent()

  const handleClickPythonDirectoryChange: React.MouseEventHandler<HTMLButtonElement> = _event => {
    dispatch(changePythonPathOverrideConfig())
    trackEvent({
      name: ANALYTICS_CHANGE_PATH_TO_PYTHON_DIRECTORY,
      properties: {},
    })
  }

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <StyledText
          css={TYPOGRAPHY.h3SemiBold}
          paddingBottom={SPACING.spacing8}
          id="AdvancedSettings_overridePathToPython"
        >
          {t('override_path_to_python')}
        </StyledText>
        <StyledText as="p" paddingBottom={SPACING.spacing8}>
          {t('opentrons_app_will_use_interpreter')}
        </StyledText>
        <StyledText
          as="h6"
          textTransform={TYPOGRAPHY.textTransformUppercase}
          color={COLORS.grey50}
          paddingBottom={SPACING.spacing4}
        >
          {t('override_path')}
        </StyledText>
        {pathToPythonInterpreter !== null ? (
          <Link
            role="button"
            css={TYPOGRAPHY.pRegular}
            color={COLORS.black90}
            onClick={() => dispatch(openPythonInterpreterDirectory())}
            id="AdvancedSettings_sourceFolderLinkPython"
          >
            {pathToPythonInterpreter}
            <Icon
              height="0.75rem"
              marginLeft={SPACING.spacing8}
              name="open-in-new"
            />
          </Link>
        ) : (
          <StyledText as="p">{t('no_specified_folder')}</StyledText>
        )}
      </Box>
      {pathToPythonInterpreter !== null ? (
        <TertiaryButton
          marginLeft={SPACING_AUTO}
          onClick={() =>
            dispatch(resetConfigValue('python.pathToPythonOverride'))
          }
          id="AdvancedSettings_changePythonInterpreterSource"
        >
          {t('reset_to_default')}
        </TertiaryButton>
      ) : (
        <TertiaryButton
          marginLeft={SPACING_AUTO}
          onClick={handleClickPythonDirectoryChange}
          id="AdvancedSettings_changePythonInterpreterSource"
        >
          {t('add_override_path')}
        </TertiaryButton>
      )}
    </Flex>
  )
}
