Basic usage:

```js
import { LabeledValue } from '@opentrons/components'
;<Card title="Hello Title Card">
  <div
    style={{
      display: 'inline-block',
      width: '50%',
      height: '4rem',
      padding: '1rem',
    }}
  >
    <LabeledValue label={'Label'} value={'Value'} />
  </div>
  <div
    style={{
      display: 'inline-block',
      width: '50%',
      height: '4rem',
      padding: '1rem',
    }}
  >
    <LabeledValue label={'Label'} value={'Value'} />
  </div>
</Card>
```

Disable the card:

```js
import { LabeledValue } from '@opentrons/components'
;<Card title="Hello Title Card" disabled>
  <div
    style={{
      display: 'inline-block',
      width: '50%',
      height: '4rem',
      padding: '1rem',
    }}
  >
    <LabeledValue label={'Label'} value={'Value'} />
  </div>
  <div
    style={{
      display: 'inline-block',
      width: '50%',
      height: '4rem',
      padding: '1rem',
    }}
  >
    <LabeledValue label={'Label'} value={'Value'} />
  </div>
</Card>
```
