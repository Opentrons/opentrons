import {
  useLightsQuery,
  useSetLightsMutation,
} from '@opentrons/react-api-client'

const LIGHTS_POLL_MS = 5000
export function useLights(): {
  lightsOn: boolean | null
  toggleLights: () => void
} {
  const { setLights } = useSetLightsMutation()
  const { data: lightsData } = useLightsQuery({
    refetchInterval: LIGHTS_POLL_MS,
  })
  const lightsOn = lightsData != null ? lightsData.on : false

  const toggleLights = (): void => {
    setLights({ on: !Boolean(lightsOn) })
  }

  return { lightsOn, toggleLights }
}
