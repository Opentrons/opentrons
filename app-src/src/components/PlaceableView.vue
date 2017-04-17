<template>
  <div class="task">
  <div class="placeable">
    <deck-map v-if='instrument()' :placeable='placeable()' :instrument='instrument()' :deck='deck()' ></deck-map>

    <CalibratePlaceable :placeable='placeable()' :instrument='instrument()'></CalibratePlaceable>
  </div>
        <section id='instructions' v-if='this.instrument() && this.placeable()'></section>
  </div>
</template>

<script>
  import CalibratePlaceable from './CalibratePlaceable.vue'
  import DeckMap from './DeckMap.vue'

  export default {
    name: 'PlaceableView',
    components: {
      CalibratePlaceable,
      DeckMap
    },
    methods: {
      params () {
        return this.$route.params
      },
      deck () {
        return this.$store.state.tasks.deck
      },
      placeable () {
        let placeable = this.deck().filter((p) => {
          return p.label === this.params().placeable && p.slot === this.params().slot
        })[0]
        let sanitized = ['point', 'tiprack', 'trough', 'tuberack'].filter((el) =>
          placeable.type.includes(el)
        )[0]
        placeable.sanitizedType = sanitized || 'default'
        return placeable
      },
      instrument () {
        return this.placeable().instruments.filter((instrument) => {
          return instrument.axis === this.params().instrument
        })[0]
      }
    },
    computed: {
      channels () {
        return this.instrument().channels === 1 ? 'single' : 'multi'
      }
    },
    created: function () {
      if (!this.$store.state.tasks[0]) {
        this.$store.dispatch('loadProtocol')
      }
    }
  }

</script>
