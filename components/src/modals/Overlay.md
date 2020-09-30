Use `<Overlay>` to create a custom modal.

_Note_: the CSS rules on the parent in the below example are necessary and can be applied with:

```css static
@import '@opentrons/components';

.custom_modal {
  @apply --modal;
}
```

```js
import { FlatButton } from '@opentrons/components'
const [state, setState] = React.useState({ covered: false })
;<div style={{ width: '16rem', height: '16rem', position: 'relative' }}>
  <FlatButton onClick={() => setState({ covered: true })}>
    Take cover
  </FlatButton>

  {state.covered && (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      }}
    >
      <Overlay onClick={() => setState({ covered: false })} />
      <p style={{ color: 'white', zIndex: 1 }}>Click to close.</p>
    </div>
  )}
</div>
```
