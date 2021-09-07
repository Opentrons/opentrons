import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import uniqBy from 'lodash/uniqBy'

import { selectors as robotSelectors } from '../../../redux/robot'
import { PIPETTE_MOUNTS, getAttachedPipettes } from '../../../redux/pipettes'
import { getCalibratePipettesLocations } from '../../../redux/nav'
import { fetchTipLengthCalibrations } from '../../../redux/calibration'
import {
  TitledList,
  Flex,
  Text,
  C_DARK_GRAY,
  C_MED_GRAY,
  SPACING_3,
  FONT_SIZE_BODY_2,
  FONT_WEIGHT_SEMIBOLD,
  TEXT_TRANSFORM_UPPERCASE,
} from '@opentrons/components'
import { PipetteTiprackListItem } from './PipetteTiprackListItem'

import type { BaseProtocolLabware } from '../../../redux/calibration/types'
import type { Dispatch, State } from '../../../redux/types'

export interface PipetteListComponentProps extends RouteComponentProps {
  robotName: string | null
  tipracks: BaseProtocolLabware[]
}

// TODO(bc, 2021-05-17): remove this withRouter? it seems unused
export const PipetteList = withRouter(PipetteListComponent)

export function PipetteListComponent(
  props: PipetteListComponentProps
): JSX.Element {
  const { t } = useTranslation('protocol_calibration')
  const dispatch = useDispatch<Dispatch>()

  const { robotName, tipracks } = props
  const protocolPipettes = useSelector(robotSelectors.getPipettes)
  const urlsByMount = useSelector(getCalibratePipettesLocations)
  const attachedPipettes = useSelector((state: State) =>
    getAttachedPipettes(state, robotName)
  )

  React.useEffect(() => {
    robotName && dispatch(fetchTipLengthCalibrations(robotName))
  }, [dispatch, robotName])

  return (
    <TitledList
      key={t<string>('tip_length_cal_title')}
      title={t('tip_length_cal_title')}
    >
      {PIPETTE_MOUNTS.map(mount => {
        const protocolPipette =
          protocolPipettes.find(i => i.mount === mount) || null
        const attachedPipette = attachedPipettes[mount]
        const displayName = protocolPipette?.modelSpecs?.displayName || 'N/A'
        const { disabledReason = null } = urlsByMount[mount].default
        const pipTipracks = uniqBy(
          tipracks.filter(
            t =>
              t.calibratorMount === mount ||
              (protocolPipette
                ? protocolPipette.tipRacks.includes(t._id)
                : false)
          ),
          t => t.definitionHash ?? t.name
        )
        const calibratePathFor = (
          mount: 'left' | 'right',
          hash: string | null
        ): string => {
          const url =
            urlsByMount[mount][hash ?? 'default'] ?? urlsByMount[mount].default
          return url.path
        }
        return (
          <React.Fragment key={`${mount}`}>
            <Flex key={`${mount} box`}>
              <Text
                key={`${mount} key`}
                marginLeft={SPACING_3}
                paddingTop={SPACING_3}
                color={disabledReason ? C_MED_GRAY : C_DARK_GRAY}
                fontSize={FONT_SIZE_BODY_2}
                fontWeight={FONT_WEIGHT_SEMIBOLD}
                textTransform={TEXT_TRANSFORM_UPPERCASE}
              >
                {mount.charAt(0)}
              </Text>
              <TitledList
                key={`${mount} title`}
                title={displayName}
                disabled={!!disabledReason}
              />
            </Flex>
            {pipTipracks?.length
              ? pipTipracks?.map(tr => {
                  return (
                    <PipetteTiprackListItem
                      {...tr}
                      key={tr.name}
                      robotName={robotName}
                      pipette={attachedPipette}
                      calibrateUrl={calibratePathFor(mount, tr.definitionHash)}
                    />
                  )
                })
              : null}
          </React.Fragment>
        )
      })}
    </TitledList>
  )
}
