// app info card with version and updated
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import startCase from 'lodash/startCase'

import {
  Card,
  LabeledRadioGroup,
  LabeledSelect,
  LabeledToggle,
} from '@opentrons/components'

import * as Config from '../../../redux/config'
import * as Calibration from '../../../redux/calibration'

import type { DropdownOption } from '@opentrons/components'
import type { DevInternalFlag } from '../../../redux/config/types'
import type { State, Dispatch } from '../../../redux/types'

const TITLE = 'Advanced Settings'

const USE_TRASH_SURFACE_TIP_CAL_LABEL = 'Tip Length Calibration Settings'
const USE_TRASH_SURFACE_TIP_CAL_BODY =
  "An Opentrons Calibration Block makes tip length calibration easier. Contact us to request a calibration block. If you don't have one, use the Trash Bin."
const ALWAYS_USE_BLOCK_LABEL = 'Always use Calibration Block to calibrate'
const ALWAYS_USE_TRASH_LABEL = 'Always use Trash Bin to calibrate'
const ALWAYS_PROMPT_LABEL =
  'Always show prompt to choose Calibration Block or Trash Bin'
const ALWAYS_BLOCK: 'always-block' = 'always-block'
const ALWAYS_TRASH: 'always-trash' = 'always-trash'
const ALWAYS_PROMPT: 'always-prompt' = 'always-prompt'

type BlockSelection =
  | typeof ALWAYS_BLOCK
  | typeof ALWAYS_TRASH
  | typeof ALWAYS_PROMPT

const UPDATE_CHANNEL_LABEL = 'Update Channel'
const UPDATE_CHANNEL_BODY =
  'Sets the update channel of your app. "Stable" receives the latest stable releases. "Beta" is updated more frequently so you can try out new features, but the releases may be less well tested than "Stable".'

const ENABLE_DEV_TOOLS_LABEL = 'Enable Developer Tools'
const ENABLE_DEV_TOOLS_BODY =
  "Requires restart. Turns on the app's developer tools, which provide access to the inner workings of the app and additional logging."

const DEV_TITLE = 'Developer Only (unstable)'

const LABWARE_OFFSET_DATA_LABEL =
  'Display a link to download Labware Offset Data'
const LABWARE_OFFSET_DATA_BODY =
  'If you need to access Labware Offset data outside of the Opentrons App, enabling this setting will display a link to download Offset Data (if it is present) on the Labware Setup section of the Protocol page and the Labware Position Check Summary screen.'

export function AppAdvancedSettingsCard(): JSX.Element {
  const useTrashSurfaceForTipCal = useSelector((state: State) =>
    Config.getUseTrashSurfaceForTipCal(state)
  )
  const devToolsOn = useSelector(Config.getDevtoolsEnabled)
  const devInternalFlags = useSelector(Config.getFeatureFlags)
  const channel = useSelector(Config.getUpdateChannel)
  const channelOptions: DropdownOption[] = useSelector(
    Config.getUpdateChannelOptions
  )
  const isLabwareOffsetCodeSnippetsOn = useSelector(
    Config.getIsLabwareOffsetCodeSnippetsOn
  )
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
  const toggleLabwareOffsetData = (): unknown =>
    dispatch(
      Config.updateConfigValue(
        'labware.showLabwareOffsetCodeSnippets',
        Boolean(!isLabwareOffsetCodeSnippetsOn)
      )
    )
  const toggleDevtools = (): unknown => dispatch(Config.toggleDevtools())
  const toggleDevInternalFlag = (flag: DevInternalFlag): unknown =>
    dispatch(Config.toggleDevInternalFlag(flag))
  const handleChannel: React.ChangeEventHandler<HTMLSelectElement> = event =>
    dispatch(Config.updateConfigValue('update.channel', event.target.value))
  return (
    <>
      <Card title={TITLE}>
        <LabeledRadioGroup
          data-test="useTrashSurfaceForTipCalRadioGroup"
          label={USE_TRASH_SURFACE_TIP_CAL_LABEL}
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
            handleUseTrashSelection(event.currentTarget.value as BlockSelection)
          }}
          options={[
            { name: ALWAYS_USE_BLOCK_LABEL, value: ALWAYS_BLOCK },
            { name: ALWAYS_USE_TRASH_LABEL, value: ALWAYS_TRASH },
            { name: ALWAYS_PROMPT_LABEL, value: ALWAYS_PROMPT },
          ]}
        >
          <p>{USE_TRASH_SURFACE_TIP_CAL_BODY}</p>
        </LabeledRadioGroup>
        <LabeledToggle
          data-test="labwareOffsetData"
          label={LABWARE_OFFSET_DATA_LABEL}
          toggledOn={isLabwareOffsetCodeSnippetsOn}
          onClick={toggleLabwareOffsetData}
        >
          <p>{LABWARE_OFFSET_DATA_BODY}</p>
        </LabeledToggle>
        <LabeledSelect
          data-test="updateChannelSetting"
          label={UPDATE_CHANNEL_LABEL}
          value={channel}
          options={channelOptions}
          onChange={handleChannel}
        >
          <p>{UPDATE_CHANNEL_BODY}</p>
        </LabeledSelect>
        <LabeledToggle
          data-test="enableDevToolsToggle"
          label={ENABLE_DEV_TOOLS_LABEL}
          toggledOn={devToolsOn}
          onClick={toggleDevtools}
        >
          <p>{ENABLE_DEV_TOOLS_BODY}</p>
        </LabeledToggle>
      </Card>
      {devToolsOn && (
        <Card title={DEV_TITLE}>
          {Config.DEV_INTERNAL_FLAGS.map(flag => (
            <LabeledToggle
              key={flag}
              data-test={`devInternalToggle${flag}`}
              label={`__DEV__ ${startCase(flag)}`}
              toggledOn={Boolean(devInternalFlags?.[flag])}
              onClick={() => toggleDevInternalFlag(flag)}
            />
          ))}
        </Card>
      )}
    </>
  )
}
