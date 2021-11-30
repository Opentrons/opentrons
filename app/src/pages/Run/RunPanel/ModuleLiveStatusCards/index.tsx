import * as React from 'react'
import isEmpty from 'lodash/isEmpty'
import { useSelector } from 'react-redux'

import {
  THERMOCYCLER_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  useSendModuleCommand,
  getModuleControlsDisabled,
} from '../../../../redux/modules'

import { TempDeckCard } from './TempDeckCard'
import { MagDeckCard } from './MagDeckCard'
import { ThermocyclerCard } from './ThermocyclerCard'
import { useModuleRenderInfoById } from '../../../../organisms/ProtocolSetup/hooks'

export const ModuleLiveStatusCards = (): JSX.Element | null => {
  const moduleInfoById = useModuleRenderInfoById()
  const sendModuleCommand = useSendModuleCommand()
  const controlDisabledReason = useSelector(getModuleControlsDisabled)
  const [expandedCard, setExpandedCard] = React.useState(
    isEmpty(moduleInfoById)
      ? Object.entries(moduleInfoById)[0][1].attachedModuleMatch?.serial
      : ''
  )
  const prevModuleCountRef = React.useRef<number>(
    Object.keys(moduleInfoById).length
  )
  React.useEffect(() => {
    if (prevModuleCountRef.current === 0 && !isEmpty(moduleInfoById)) {
      setExpandedCard(
        Object.entries(moduleInfoById)[0][1].attachedModuleMatch?.serial
      )
    }
    prevModuleCountRef.current = Object.keys(moduleInfoById).length
  }, [moduleInfoById])

  const makeToggleCard = (serial: string) => () => {
    setExpandedCard(serial === expandedCard ? '' : serial)
  }
  if (isEmpty(moduleInfoById)) return null

  const moduleList = Object.entries(moduleInfoById)

  return (
    <>
      {moduleList.map(([, moduleInfo]) => {
        switch (moduleInfo.attachedModuleMatch?.type) {
          case TEMPERATURE_MODULE_TYPE:
            return (
              <TempDeckCard
                key={moduleInfo.attachedModuleMatch?.serial}
                module={moduleInfo.attachedModuleMatch}
                slot={moduleInfo.slotName}
                toggleCard={makeToggleCard(
                  moduleInfo.attachedModuleMatch?.serial
                )}
                isCardExpanded={
                  expandedCard === moduleInfo.attachedModuleMatch?.serial
                }
                sendModuleCommand={sendModuleCommand}
                controlDisabledReason={controlDisabledReason}
              />
            )
          case THERMOCYCLER_MODULE_TYPE:
            return (
              <ThermocyclerCard
                key={moduleInfo.attachedModuleMatch?.serial}
                module={moduleInfo.attachedModuleMatch}
                toggleCard={makeToggleCard(
                  moduleInfo.attachedModuleMatch?.serial
                )}
                isCardExpanded={
                  expandedCard === moduleInfo.attachedModuleMatch?.serial
                }
                sendModuleCommand={sendModuleCommand}
                controlDisabledReason={controlDisabledReason}
              />
            )
          case MAGNETIC_MODULE_TYPE:
            return (
              <MagDeckCard
                key={moduleInfo.attachedModuleMatch?.serial}
                module={moduleInfo.attachedModuleMatch}
                slot={moduleInfo.slotName}
                toggleCard={makeToggleCard(
                  moduleInfo.attachedModuleMatch?.serial
                )}
                isCardExpanded={
                  expandedCard === moduleInfo.attachedModuleMatch?.serial
                }
                sendModuleCommand={sendModuleCommand}
                controlDisabledReason={controlDisabledReason}
              />
            )
          default:
            return null
        }
      })}
    </>
  )
}
