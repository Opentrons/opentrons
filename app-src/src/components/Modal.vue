<template>
  <transition name="modal">
    <div class="modal-mask" @click="$emit('close')">
      <div class="modal-wrapper">
        <div class="modal-container">
          <div class='well-img'>
            <button class="modal-close-button" @click="$emit('close')">
                X
            </button>
            <img :src='`${placeableImages(placeable.sanitizedType, channels)}`' />
            <p>Some more informative text coming soon!</p>
          </div>       
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
  export default {
    name: 'Modal',
    props: ['placeable', 'instrument'],
    computed: {
      channels () {
        return this.instrument.channels === 1 ? 'single' : 'multi'
      }
    },
    methods: {
      placeableImages (type, channels) {
        const imageUrls = {
          'default': {'single': 'well_single', 'multi': 'well_multi'},
          'tiprack': {'single': 'tiprack_single', 'multi': 'tiprack_multi'},
          'trough': {'single': 'trough_single', 'multi': 'trough_multi'},
          'tuberack': {'single': 'tuberack_single', 'multi': 'tuberack_single'},
          'point': {'single': 'point_trash', 'multi': 'point_trash'}
        }
        return require(`../assets/img/${imageUrls[type][channels]}.png`)
      }
    }
  }
</script>
