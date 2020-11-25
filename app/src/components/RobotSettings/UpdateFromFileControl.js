// @flow
import * as React from 'react'
import cx from 'classnames'
import { useTranslation, Trans } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { css } from 'styled-components'

import {
  Link,
  SecondaryBtn,
  Tooltip,
  useHoverTooltip,
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING_3,
} from '@opentrons/components'

import {
  getBuildrootUpdateDisplayInfo,
  startBuildrootUpdate,
} from '../../buildroot'

import { LabeledValue } from '../structure'

import type { State, Dispatch } from '../../types'

const HIDDEN_CSS = css`
  position: fixed;
  clip: rect(1px 1px 1px 1px);
`

export type UpdateFromFileControlProps = {|
  robotName: string,
|}

export function UpdateFromFileControl(
  props: UpdateFromFileControlProps
): React.Node {
  const { robotName } = props
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const { updateFromFileDisabledReason } = useSelector((state: State) => {
    return getBuildrootUpdateDisplayInfo(state, robotName)
  })
  const updateDisabled = updateFromFileDisabledReason !== null
  const [updateBtnProps, updateBtnTooltipProps] = useHoverTooltip()

  const handleChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
    const { files } = event.target
    if (files.length === 1 && !updateDisabled) {
      // NOTE: File.path is Electron-specific
      // https://electronjs.org/docs/api/file-object
      dispatch(startBuildrootUpdate(robotName, (files[0]: any).path))
    }
    // clear input value to allow same file to be selected again if necessary
    event.target.value = ''
  }

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING_3}
    >
      <LabeledValue
        label={t('robot_settings.advanced.update_from_file_label')}
        value={
          <Trans
            i18nKey="robot_settings.advanced.update_from_file_description"
            components={{
              a: <Link external href="https://www.opentrons.com/ot-app/" />,
            }}
          />
        }
      />
      <SecondaryBtn
        as="label"
        width="9rem"
        className={cx({ disabled: updateDisabled })}
        {...updateBtnProps}
      >
        {t('button.browse')}
        <input
          type="file"
          onChange={handleChange}
          disabled={updateDisabled}
          css={HIDDEN_CSS}
        />
      </SecondaryBtn>
      {updateFromFileDisabledReason !== null && (
        <Tooltip {...updateBtnTooltipProps}>
          {updateFromFileDisabledReason}
        </Tooltip>
      )}
    </Flex>
  )
}
