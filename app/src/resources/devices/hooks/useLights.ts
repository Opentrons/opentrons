import { useEffect, useState } from 'react'

import {
  useLightsQuery,
  useSetLightsMutation,
} from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'

const LIGHTS_POLL_MS = 5000
export function useLights(): {
  lightsOn: boolean | null
  toggleLights: () => void
} {
  const documentationState = useDocumentationState()
  const [lightsOnCache, setLightsOnCache] = useState(false)
  const { setLights, data: setLightsData } =
    useSetLightsMutation(documentationState)
  const { data: lightsData } = useLightsQuery({
    refetchInterval: LIGHTS_POLL_MS,
  })

  useEffect(() => {
    if (setLightsData != null) {
      setLightsOnCache(setLightsData.on)
    } else if (lightsData != null) {
      setLightsOnCache(lightsData.on)
    }
  }, [lightsData, setLightsData])

  const toggleLights = (): void => {
    const newLightsOn = !Boolean(lightsOnCache)
    setLightsOnCache(newLightsOn)
    setLights(
      { on: newLightsOn },
      {
        onError: () => {
          setLightsOnCache(!newLightsOn)
        },
      }
    )
  }

  return { lightsOn: lightsOnCache, toggleLights }
}
