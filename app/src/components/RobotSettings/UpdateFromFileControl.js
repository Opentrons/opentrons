// @flow
import * as React from 'react'
import cx from 'classnames'
import { useDispatch, useSelector } from 'react-redux'
import { css } from 'styled-components'

import {
  Link,
  SecondaryBtn,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'

import {
  getBuildrootUpdateDisplayInfo,
  startBuildrootUpdate,
} from '../../buildroot'

import { TitledControl } from '../TitledControl'

import type { StyleProps } from '@opentrons/components'
import type { State, Dispatch } from '../../types'

// TODO(mc, 2020-08-03): i18n
const BROWSE = 'browse'
const UPDATE_FROM_FILE = 'Update robot software from file'
const UPDATE_FROM_FILE_DESCRIPTION = (
  <>
    If your app is unable to auto-download robot updates, you can{' '}
    <Link external href="https://www.opentrons.com/ot-app/">
      download the robot update yourself
    </Link>{' '}
    and update your robot manually
  </>
)

const HIDDEN_CSS = css`
  position: fixed;
  clip: rect(1px 1px 1px 1px);
`

export type UpdateFromFileControlProps = {|
  robotName: string,
  ...StyleProps,
|}

export function UpdateFromFileControl(
  props: UpdateFromFileControlProps
): React.Node {
  const { robotName, ...styleProps } = props
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
    <TitledControl
      title={UPDATE_FROM_FILE}
      description={UPDATE_FROM_FILE_DESCRIPTION}
      control={
        <SecondaryBtn
          as="label"
          width="9rem"
          className={cx({ disabled: updateDisabled })}
          {...updateBtnProps}
        >
          {BROWSE}
          <input
            type="file"
            onChange={handleChange}
            disabled={updateDisabled}
            css={HIDDEN_CSS}
          />
        </SecondaryBtn>
      }
      {...styleProps}
    >
      {updateFromFileDisabledReason !== null && (
        <Tooltip {...updateBtnTooltipProps}>
          {updateFromFileDisabledReason}
        </Tooltip>
      )}
    </TitledControl>
  )
}
