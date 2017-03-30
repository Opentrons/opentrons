<template>

  <div class="task">
    <deck-map v-if='instrument()' :placeable='placeable()' :instrument='instrument()' :deck='deck()' ></deck-map>

    <section id='task-placeable' v-if='this.instrument() && this.placeable()'>
      <h1 class='title'>
        Calibrate the {{this.instrument().label}} pipette to the
        {{this.placeable().sanitizedType === 'tiprack' ? 'center' : 'bottom'}}
        {{this.calibrationPoint}} of your {{this.placeable.label}} container
      </h1>
      <CalibratePlaceable :placeable='placeable()' :instrument='instrument()'></CalibratePlaceable>
    </section>

  </div>
</template>

<script>
  import CalibratePlaceable from './CalibratePlaceable.vue'
  import DeckMap from './DeckMap.vue'

  export default {
    name: 'Placeable',
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
      },
      calibrationPoint () {
        let type = this.placeable().sanitizedType
        let position = 'of the A1 well'
        if (type === 'trough') {
          position = 'of the A1 slot'
        } else if ((type === 'tiprack' || type === 'default') && this.instrument().channels === 8) {
          position = 'of the A1 row'
        } else if (type === 'point') {
          position = ''
        }
        return position
      }
    },
    created: function () {
      if (!this.$store.state.tasks[0]) {
        this.$store.dispatch('loadProtocol')
      }
    }
  }
</script>
