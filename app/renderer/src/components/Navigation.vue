<template>
  <nav>
    <router-link :to="prev" class="prev">Prev</router-link>
    <!-- <a href="#info" class="help">?</a> -->
    <router-link :to="next" class="next">Next</router-link>
  </nav>
</template>

<script>
    export default {
        props: ['prev', 'next'],
        computed: {
            connected() {
                return this.$store.state.is_connected
            }
        }
    }
</script>
