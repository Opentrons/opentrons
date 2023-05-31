export function get96ChannelFromModel(instrumentModel?: string): boolean {
  let is96ChannelAttached = false

  switch (instrumentModel) {
    case 'p1000_96_v1':
    case 'p1000_96_v3.0':
    case 'p1000_96_v3.3': {
      is96ChannelAttached = true
      break
    }
  }
  return is96ChannelAttached
}
