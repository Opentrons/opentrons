<template>
  <section id="deck-map">
    <div class="deck-container">
     <div v-for="col in cols" class="deck-col">
        <div v-for="row in rows" class="deck-slot" :id="col+row">
            <p>{{ col }}{{ row }}</p>
       </div>
      </div>
    </div>
  </section>
</template>

<script>
  export default{
    name: 'DeckMap',
    props: ['placeable'],
    data () {
      return {
        cols: ['A', 'B', 'C', 'D', 'E']
      }
    },
    computed: {
      rows () {
        let baseRows = [1, 2, 3]
        if (this.$store.state.versions.ot_version) {
          let version = this.$store.state.versions.ot_version.version
          if (version === 'hood') {
            baseRows.pop()
          }
        }
        return baseRows
      }
    }
  }

</script>