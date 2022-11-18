import * as React from 'react'
import capitalize from 'lodash/capitalize'
import { Trans, useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Flex, Icon, JUSTIFY_CENTER } from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import screwPattern from '../../assets/images/change-pip/screw-pattern.png'
import { fetchPipettes, FETCH_PIPETTES } from '../../redux/pipettes'
import {
  FAILURE,
  getRequestById,
  PENDING,
  SUCCESS,
  useDispatchApiRequests,
} from '../../redux/robot-api'
import type { RequestState } from '../../redux/robot-api/types'
import type { State } from '../../redux/types'
import type { PipetteWizardStepProps } from './types'

export const MountPipette = (props: PipetteWizardStepProps): JSX.Element => {
  const { proceed, goBack, robotName } = props
  const { t } = useTranslation('pipette_wizard_flows')
  const fetchPipettesRequestId = React.useRef<string | null>(null)
  const [dispatch] = useDispatchApiRequests(dispatchedAction => {
    if (
      dispatchedAction.type === FETCH_PIPETTES &&
      // @ts-expect-error(sa, 2021-05-27): avoiding src code change, need to type narrow
      dispatchedAction.meta.requestId
    ) {
      // @ts-expect-error(sa, 2021-05-27): avoiding src code change, need to type narrow
      fetchPipettesRequestId.current = dispatchedAction.meta.requestId
    }
  })
  const handleClick = (): void => dispatch(fetchPipettes(robotName, true))
  const requestStatus = useSelector<State, RequestState | null>(state =>
    fetchPipettesRequestId.current
      ? getRequestById(state, fetchPipettesRequestId.current)
      : null
  )?.status
  const isPending = requestStatus === PENDING

  React.useEffect(() => {
    //  if requestStatus is FAILURE then the error modal will be in the results page
    if (requestStatus === SUCCESS || requestStatus === FAILURE) proceed()
  }, [proceed, requestStatus])

  return (
    <GenericWizardTile
      header={t('connect_and_screw_in_pipette')}
      rightHandBody={
        <Flex justifyContent={JUSTIFY_CENTER}>
          <img
            //  TODO(jr, 11/18/22): attach real image
            src={screwPattern}
            width="171px"
            height="248px"
            alt="Screw pattern"
          />
        </Flex>
      }
      bodyText={
        <Trans
          t={t}
          i18nKey="hold_onto_pipette"
          components={{
            block: <StyledText as="p" marginBottom="1rem" />,
          }}
        />
      }
      proceedButtonText={
        isPending ? (
          //  TODO(jr 11/17/22): temporary spinner until we implement the simmer state
          <Flex width="5rem" justifyContent={JUSTIFY_CENTER}>
            <Icon name="ot-spinner" height="1rem" spin />
          </Flex>
        ) : (
          capitalize(t('continue'))
        )
      }
      back={goBack}
      proceed={handleClick}
      proceedIsDisabled={isPending}
    />
  )
}
