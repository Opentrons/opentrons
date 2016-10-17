<template>
<div class="move">
  <h3 class="title">Jog X-Y-Z</h3>
  <div class="jog">
    <a href="#" data-axis="y" data-direction="neg" class="btn-full btn-y">Y</a>
    <a href="#" data-axis="z" data-direction="neg" class="btn-full btn-z">Z</a>
    <a href="#" data-axis="x" data-direction="neg" class="btn-full x">X</a>
    <a href="#" data-axis="x" data-direction="pos" class="btn-full btn-x">X</a>
    <a href="#" data-axis="y" data-direction="pos" class="btn-full btn-y">Y</a>
    <a href="#" data-axis="z" data-direction="pos" class="btn-full btn-z">Z</a>
  </div>
  <h3 class="title">Select Increment [mm]</h3>
  <div class="increment xyz">
    <button data-increment="20" class="btn-full btn-group">20</button>
    <button data-increment="10" class="btn-full btn-group">10</button>
    <button data-increment="5" class="btn-full btn-group">5</button>
    <button data-increment="1" class="btn-full btn-group">1</button>
    <button data-increment="0.5" class="btn-full btn-group">0.5</button>
    <button data-increment="0.1" class="btn-full btn-group">0.1</button>
    <button data-increment="91" class="btn-slot">&#8596; slot-x </button>
    <button data-increment="135" class="btn-slot">&#8597; slot-y </button>
  </div>
    <!-- End Deck -->
  </div>
  <!-- End Move -->
</template>

<script>
export default {
  name: 'Jog',
  data: function () {
    return {
      increment: 1
    }
  }
}
</script>