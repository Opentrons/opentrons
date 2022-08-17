import * as React from 'react'
import { useSelector } from 'react-redux'
import {
  useDispatchApiRequests,
  getRequestById,
  PENDING,
  SUCCESS,
} from '../../redux/robot-api'
import { useFeatureFlag } from '../../redux/config'
import { fetchPipettes, FETCH_PIPETTES } from '../../redux/pipettes'
import {
  PrimaryButton as DeprecatedPrimaryButton,
  Icon,
  DIRECTION_ROW,
  SPACING,
  Flex,
  COLORS,
  ALIGN_CENTER,
} from '@opentrons/components'
import { PrimaryButton } from '../../atoms/buttons'

import type { State } from '../../redux/types'
import type { RequestState } from '../../redux/robot-api/types'

export interface CheckPipetteButtonProps {
  robotName: string
  children: React.ReactNode
  className?: string
  hidden?: boolean
  onDone?: () => void
}

export function CheckPipettesButton(
  props: CheckPipetteButtonProps
): JSX.Element | null {
  const { robotName, onDone, children, className, hidden = false } = props
  const enableChangePipetteWizard = useFeatureFlag('enableChangePipetteWizard')
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
  const pending = requestStatus === PENDING

  React.useEffect(() => {
    if (requestStatus === SUCCESS && onDone) onDone()
  }, [onDone, requestStatus])

  const displayButton = hidden ? null : (
    <DeprecatedPrimaryButton
      onClick={handleClick}
      disabled={pending}
      className={className}
    >
      {pending ? <Icon name="ot-spinner" height="1em" spin /> : children}
    </DeprecatedPrimaryButton>
  )

  return enableChangePipetteWizard ? (
    <PrimaryButton onClick={handleClick}>
      <Flex
        flexDirection={DIRECTION_ROW}
        color={COLORS.white}
        alignItems={ALIGN_CENTER}
      >
        {pending ? (
          <Icon
            name="ot-spinner"
            height="1em"
            spin
            marginRight={SPACING.spacing2}
          />
        ) : null}
        {children}
      </Flex>
    </PrimaryButton>
  ) : (
    //  TODO(jr, 17/08/22): remove this button when we remove the FF
    displayButton
  )
}
