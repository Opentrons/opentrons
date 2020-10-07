// @flow
// app info card with version and updated
import * as React from 'react'
import { Link } from 'react-router-dom'

import {
  ALIGN_START,
  SPACING_3,
  SPACING_AUTO,
  Card,
  Flex,
  LabeledValue,
  SecondaryBtn,
  useMountEffect,
} from '@opentrons/components'

import { CURRENT_VERSION } from '../../shell'

export type AppInfoCardProps = {|
  availableVersion: ?string,
  checkUpdate: () => void,
|}

const INFORMATION = 'Information'
const VERSION_LABEL = 'Software Version'

const UPDATE_AVAILABLE = 'view available update'
const UPDATE_NOT_AVAILABLE = 'up to date'

export function AppInfoCard(props: AppInfoCardProps): React.Node {
  const { checkUpdate, availableVersion } = props

  useMountEffect(checkUpdate)

  return (
    <Card title={INFORMATION}>
      <Flex padding={SPACING_3} alignItems={ALIGN_START}>
        <LabeledValue label={VERSION_LABEL} value={CURRENT_VERSION} />
        <SecondaryBtn
          as={Link}
          to="/more/app/update"
          disabled={!availableVersion}
          marginLeft={SPACING_AUTO}
        >
          {availableVersion ? UPDATE_AVAILABLE : UPDATE_NOT_AVAILABLE}
        </SecondaryBtn>
      </Flex>
    </Card>
  )
}
