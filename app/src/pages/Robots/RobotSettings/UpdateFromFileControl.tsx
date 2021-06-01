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
  SPACING_4,
  SIZE_4,
} from '@opentrons/components'

import {
  getBuildrootUpdateDisplayInfo,
  startBuildrootUpdate,
} from '../../../redux/buildroot'

import { LabeledValue } from '../../../atoms/structure'

import type { State, Dispatch } from '../../../redux/types'

const HIDDEN_CSS = css`
  position: fixed;
  clip: rect(1px 1px 1px 1px);
`

export interface UpdateFromFileControlProps {
  robotName: string
}

export function UpdateFromFileControl(
  props: UpdateFromFileControlProps
): JSX.Element {
  const { robotName } = props
  const { t } = useTranslation(['robot_advanced_settings', 'shared'])
  const dispatch = useDispatch<Dispatch>()
  const { updateFromFileDisabledReason } = useSelector((state: State) => {
    return getBuildrootUpdateDisplayInfo(state, robotName)
  })
  const updateDisabled = updateFromFileDisabledReason !== null
  const [updateBtnProps, updateBtnTooltipProps] = useHoverTooltip()

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = event => {
    const { files } = event.target
    // TODO(bc, 2021-05-28): augment the file interface to remove the any cast below
    if (files?.length === 1 && !updateDisabled) {
      // NOTE: File.path is Electron-specific
      // https://electronjs.org/docs/api/file-object
      dispatch(startBuildrootUpdate(robotName, (files[0] as any).path))
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
        label={t('update_from_file_label')}
        value={
          <Trans
            t={t}
            i18nKey="update_from_file_description"
            components={{
              a: <Link external href="https://www.opentrons.com/ot-app/" />,
            }}
          />
        }
      />
      <SecondaryBtn
        as="label"
        minWidth={SIZE_4}
        marginLeft={SPACING_4}
        className={cx({ disabled: updateDisabled })}
        {...updateBtnProps}
      >
        {t('shared:browse')}
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
