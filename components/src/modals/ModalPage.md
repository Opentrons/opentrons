Basic usage:

```js
<div style={{position: 'relative', width: '48em', height: '24rem'}}>
  <ModalPage
    titleBar={{
      title: 'Title',
      subtitle: 'Subtitle',
      back: {
        children: 'back',
        onClick: () => alert('back button clicked')
      }
    }}
    heading ='Optional styled heading'
    >
    <p>Click the back button for an back action.</p>
  </ModalPage>
</div>
```
