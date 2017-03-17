<template>
  <section id='deck' :class="{'disabled': busy}">
    <div class='deck'>
      <button v-for='slot in slots()' @click='jogToSlot(slot)'>
        {{slot}}
      </button>
    </div>
  </section>
</template>

<script>
  export default {
    name: 'DeckSlot',
    props: ['busy'],
    methods: {
      jogToSlot (slot) {
        this.$store.dispatch('jogToSlot', {slot: slot})
      },
      slots () {
        let baseSlots = [
          'A2', 'B2', 'C2', 'D2', 'E2',
          'A1', 'B1', 'C1', 'D1', 'E1'
        ]
        if (this.$store.state.versions.ot_version) {
          let version = this.$store.state.versions.ot_version.version
          if (version !== 'hood') {
            baseSlots.unshift('A3', 'B3', 'C3', 'D3', 'E3')
          }
        }
        return baseSlots
      }
    }
  }
</script>
