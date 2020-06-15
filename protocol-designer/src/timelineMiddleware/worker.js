import { generateRobotStateTimeline } from './generateRobotStateTimeline'

self.addEventListener('message', event => {
  const { data } = event
  const result = generateRobotStateTimeline(data)
  postMessage(result)
})
