import * as React from 'react'
import {
  useLightsQuery,
  useSetLightsMutation,
} from '@opentrons/react-api-client'

const LIGHTS_POLL_MS = 5000
export function useLights(): {
  lightsOn: boolean | null
  toggleLights: () => void
} {
  const [lightsOnCache, setLightsOnCache] = React.useState(false)
  const { setLights, data: setLightsData } = useSetLightsMutation()
  const { data: lightsData } = useLightsQuery({
    refetchInterval: LIGHTS_POLL_MS,
  })

  React.useEffect(() => {
    if (setLightsData != null) {
      setLightsOnCache(setLightsData.on)
    } else if (lightsData != null) {
      setLightsOnCache(lightsData.on)
    }
  }, [lightsData, setLightsData])

  const toggleLights = (): void => {
    setLightsOnCache(!Boolean(lightsOnCache))
    setLights({ on: !Boolean(lightsOnCache) })
  }

  return { lightsOn: lightsOnCache, toggleLights }
}
