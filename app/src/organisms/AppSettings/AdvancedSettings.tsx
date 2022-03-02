import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import {
  Flex,
  Box,
  Link,
  Icon,
  Text,
  DropdownField,
  RadioGroup,
  SPACING_AUTO,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import * as Config from '../../redux/config'
import * as Calibration from '../../redux/calibration'
import * as CustomLabware from '../../redux/custom-labware'
import { clearDiscoveryCache } from '../../redux/discovery'
import { Divider } from '../../atoms/structure'
import { TertiaryButton, ToggleButton } from '../../atoms/Buttons'

import type { Dispatch, State } from '../../redux/types'
import type { DropdownOption } from '@opentrons/components'

const ALWAYS_BLOCK: 'always-block' = 'always-block'
const ALWAYS_TRASH: 'always-trash' = 'always-trash'
const ALWAYS_PROMPT: 'always-prompt' = 'always-prompt'

type BlockSelection =
  | typeof ALWAYS_BLOCK
  | typeof ALWAYS_TRASH
  | typeof ALWAYS_PROMPT

export function AdvancedSettings(): JSX.Element {
  const { t } = useTranslation('app_settings')
  const useTrashSurfaceForTipCal = useSelector((state: State) =>
    Config.getUseTrashSurfaceForTipCal(state)
  )
  const devToolsOn = useSelector(Config.getDevtoolsEnabled)
  const channel = useSelector(Config.getUpdateChannel)
  const channelOptions: DropdownOption[] = useSelector(
    Config.getUpdateChannelOptions
  )
  const labwarePath = useSelector(CustomLabware.getCustomLabwareDirectory)
  const dispatch = useDispatch<Dispatch>()

  const handleUseTrashSelection = (selection: BlockSelection): void => {
    switch (selection) {
      case ALWAYS_PROMPT:
        dispatch(Calibration.resetUseTrashSurfaceForTipCal())
        break
      case ALWAYS_BLOCK:
        dispatch(Calibration.setUseTrashSurfaceForTipCal(false))
        break
      case ALWAYS_TRASH:
        dispatch(Calibration.setUseTrashSurfaceForTipCal(true))
        break
    }
  }
  const toggleDevtools = (): unknown => dispatch(Config.toggleDevtools())
  const handleChannel: React.ChangeEventHandler<HTMLSelectElement> = event =>
    dispatch(Config.updateConfigValue('update.channel', event.target.value))
  const displayUnavailRobots = useSelector((state: State) => {
    return Config.getConfig(state)?.discovery.disableCache ?? false
  })

  return (
    <>
      <Box paddingX={SPACING.spacing4} paddingY={SPACING.spacing5}>
        <Flex
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          gridGap={SPACING.spacing4}
        >
          <Box width="70%">
            <Text css={TYPOGRAPHY.h3SemiBold} paddingBottom={SPACING.spacing3}>
              {t('update_channel')}
            </Text>
            <Text css={TYPOGRAPHY.pRegular} paddingBottom={SPACING.spacing3}>
              {t('update_description')}
            </Text>
          </Box>
          <Box width="10rem">
            <DropdownField
              options={channelOptions}
              onChange={handleChannel}
              value={channel}
            />
          </Box>
        </Flex>
        <Divider marginY={SPACING.spacing5} />
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box width="70%">
            <Text css={TYPOGRAPHY.h3SemiBold} paddingBottom={SPACING.spacing3}>
              {t('additional_labware_folder_title')}
            </Text>
            <Text css={TYPOGRAPHY.pRegular} paddingBottom={SPACING.spacing3}>
              {t('additional_folder_description')}
            </Text>
            <Text
              css={TYPOGRAPHY.h6Default}
              textTransform={TYPOGRAPHY.textTransformUppercase}
              color={COLORS.darkGreyEnabled}
              paddingBottom={SPACING.spacing2}
            >
              {t('additional_folder_location')}
            </Text>
            {labwarePath !== '' ? (
              <Link
                css={TYPOGRAPHY.pRegular}
                external
                color={COLORS.darkBlack}
                onClick={() =>
                  dispatch(CustomLabware.openCustomLabwareDirectory())
                }
              >
                {labwarePath}
                <Icon
                  width={SPACING.spacing3}
                  height={SPACING.spacing3}
                  marginLeft={SPACING.spacing3}
                  name="open-in-new"
                />
              </Link>
            ) : (
              <Text css={TYPOGRAPHY.pRegular}>{t('no_folder')}</Text>
            )}
          </Box>
          {
            <TertiaryButton
              marginLeft={SPACING_AUTO}
              onClick={() =>
                dispatch(CustomLabware.changeCustomLabwareDirectory())
              }
            >
              {labwarePath !== ''
                ? t('change_folder_button')
                : t('add_folder_button')}
            </TertiaryButton>
          }
        </Flex>
        <Divider marginY={SPACING.spacing5} />
        <Box>
          <Text css={TYPOGRAPHY.h3SemiBold} paddingBottom={SPACING.spacing3}>
            {t('tip_length_cal_methold')}
          </Text>
          <RadioGroup
            css={TYPOGRAPHY.pRegular}
            value={
              useTrashSurfaceForTipCal === true
                ? ALWAYS_TRASH
                : useTrashSurfaceForTipCal === false
                ? ALWAYS_BLOCK
                : ALWAYS_PROMPT
            }
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              // you know this is a limited-selection field whose values are only
              // the elements of BlockSelection; i know this is a limited-selection
              // field whose values are only the elements of BlockSelection; but sadly,
              // neither of us can get Flow to know it
              handleUseTrashSelection(
                event.currentTarget.value as BlockSelection
              )
            }}
            options={[
              { name: t('cal_block'), value: ALWAYS_BLOCK },
              { name: t('trash_bin'), value: ALWAYS_TRASH },
              { name: t('prompt'), value: ALWAYS_PROMPT },
            ]}
          />
        </Box>
        <Divider marginY={SPACING.spacing5} />
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box width="70%">
            <Text css={TYPOGRAPHY.h3SemiBold} paddingBottom={SPACING.spacing3}>
              {t('display_unavail_robots')}
            </Text>
            <Text css={TYPOGRAPHY.pRegular}>
              {t('display_unavail_robots_description')}
            </Text>
          </Box>
          <ToggleButton
            label="display_unavailable_robots"
            toggledOn={!displayUnavailRobots}
            onClick={() =>
              dispatch(Config.toggleConfigValue('discovery.disableCache'))
            }
          />
        </Flex>
        <Divider marginY={SPACING.spacing5} />
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box width="70%">
            <Text css={TYPOGRAPHY.h3SemiBold} paddingBottom={SPACING.spacing3}>
              {t('clear_unavail_robots')}
            </Text>
            <Text css={TYPOGRAPHY.pRegular}>
              {t('clear_robots_description')}
            </Text>
          </Box>
          <TertiaryButton
            marginLeft={SPACING_AUTO}
            onClick={() => dispatch(clearDiscoveryCache())}
          >
            {t('clear_robots_button')}
          </TertiaryButton>
        </Flex>
        <Divider marginY={SPACING.spacing5} />
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box width="70%">
            <Text css={TYPOGRAPHY.h3SemiBold} paddingBottom={SPACING.spacing3}>
              {t('enable_dev_tools')}
            </Text>
            <Text css={TYPOGRAPHY.pRegular}>
              {t('enable_dev_tools_description')}
            </Text>
          </Box>
          <ToggleButton
            label="enable_dev_tools"
            toggledOn={devToolsOn}
            onClick={toggleDevtools}
          />
        </Flex>
      </Box>
    </>
  )
}
