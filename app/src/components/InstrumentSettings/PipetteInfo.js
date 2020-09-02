// @flow
import * as React from 'react'
import { css } from 'styled-components'
import { Link } from 'react-router-dom'
import cx from 'classnames'
import {
  LabeledValue,
  OutlineButton,
  InstrumentDiagram,
  Box,
  Flex,
  DIRECTION_COLUMN,
  SPACING_1,
  SPACING_2,
  SPACING_3,
  SIZE_4,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_FLEX_START,
  BORDER_SOLID_LIGHT,
} from '@opentrons/components'
import styles from './styles.css'
import { PipetteOffsetCalibrationControl } from './PipetteOffsetCalibrationControl'

import type { Mount, AttachedPipette } from '../../pipettes/types'

export type PipetteInfoProps = {|
  robotName: string,
  mount: Mount,
  pipette: AttachedPipette | null,
  changeUrl: string,
  settingsUrl: string | null,
|}

const LABEL_BY_MOUNT = {
  left: 'Left pipette',
  right: 'Right pipette',
}

const SERIAL_NUMBER = 'Serial number'

export function PipetteInfo(props: PipetteInfoProps): React.Node {
  const { robotName, mount, pipette, changeUrl, settingsUrl } = props
  const label = LABEL_BY_MOUNT[mount]
  const displayName = pipette ? pipette.modelSpecs.displayName : null
  const serialNumber = pipette ? pipette.id : null
  const channels = pipette ? pipette.modelSpecs.channels : null
  const direction = pipette ? 'change' : 'attach'

  const pipImage = (
    <Box
      key={`pipetteImage${mount}`}
      height={SIZE_4}
      width="2.25rem"
      border={BORDER_SOLID_LIGHT}
      marginRight={mount === 'right' ? SPACING_3 : SPACING_1}
      marginLeft={mount === 'right' ? SPACING_1 : SPACING_3}
    >
      {channels && (
        <InstrumentDiagram
          pipetteSpecs={pipette?.modelSpecs}
          mount={mount}
          className={styles.pipette_diagram}
        />
      )}
    </Box>
  )

  const pipInfo = (
    <Flex key={`pipetteInfo${mount}`} flex="1" flexDirection={DIRECTION_COLUMN}>
      <Flex
        alignItems={ALIGN_FLEX_START}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        css={css`
          max-width: 14rem;
        `}
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          height="10rem"
        >
          <LabeledValue
            label={label}
            value={(displayName || 'None').replace(/-/, '‑')} // non breaking hyphen
          />
          <LabeledValue label={SERIAL_NUMBER} value={serialNumber || 'None'} />
        </Flex>

        <OutlineButton Component={Link} to={changeUrl}>
          {direction}
        </OutlineButton>
      </Flex>
      {settingsUrl !== null && (
        <OutlineButton
          Component={Link}
          to={settingsUrl}
          css={css`
            padding: ${SPACING_2};
            margin-top: ${SPACING_3};
            width: 11rem;
          `}
        >
          settings
        </OutlineButton>
      )}
      <PipetteOffsetCalibrationControl robotName={robotName} mount={mount} />
    </Flex>
  )

  return (
    <Flex width="50%" flexDirection={DIRECTION_COLUMN}>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
        {mount === 'right' ? [pipImage, pipInfo] : [pipInfo, pipImage]}
      </Flex>
    </Flex>
  )
}

// TODO: BC 2020-09-02 remove this component once calibration overhaul feature flag is removed
export function LegacyPipetteInfo(props: PipetteInfoProps): React.Node {
  const { mount, pipette, changeUrl, settingsUrl } = props
  const label = LABEL_BY_MOUNT[mount]
  const displayName = pipette ? pipette.modelSpecs.displayName : null
  const serialNumber = pipette ? pipette.id : null
  const channels = pipette ? pipette.modelSpecs.channels : null
  const direction = pipette ? 'change' : 'attach'
  const className = cx(styles.pipette_card, {
    [styles.right]: mount === 'right',
  })

  return (
    <div className={className}>
      <div className={styles.pipette_info_block}>
        <LabeledValue
          label={label}
          value={(displayName || 'None').replace(/-/, '‑')} // non breaking hyphen
          valueClassName={styles.pipette_info_element}
        />
        <LabeledValue
          label={SERIAL_NUMBER}
          value={serialNumber || 'None'}
          valueClassName={styles.pipette_info_element}
        />
      </div>

      <div className={styles.button_group}>
        <OutlineButton Component={Link} to={changeUrl}>
          {direction}
        </OutlineButton>
        {settingsUrl !== null && (
          <OutlineButton Component={Link} to={settingsUrl}>
            settings
          </OutlineButton>
        )}
      </div>
      <div className={styles.image}>
        {channels && (
          <InstrumentDiagram
            pipetteSpecs={pipette?.modelSpecs}
            mount={mount}
            className={styles.pipette_diagram}
          />
        )}
      </div>
    </div>
  )
}
