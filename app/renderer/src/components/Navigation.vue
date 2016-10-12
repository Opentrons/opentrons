<template>
  <nav>
    <router-link :to="prev" class="prev"  v-show="connected">Prev</router-link>
    <!-- <router-link to="#info" class="help">?</router-link> -->
    <router-link :to="next" class="next"  v-show="connected">Next</router-link>
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