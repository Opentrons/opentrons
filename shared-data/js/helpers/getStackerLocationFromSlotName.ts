export function getStackerLocationFromSlotName(slotName: string): string {
  return `STACKER ${slotName.charAt(0)}`
}
