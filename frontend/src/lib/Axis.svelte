<script>

    import { select } from 'd3-selection';
    import { axisBottom, axisLeft } from 'd3-axis';

    export let innerHeight;
    export let margin;
    export let position;
    export let scale;

    let transform;
    let g;

    $: {
      select(g).selectAll('*').remove();

      let axis;
      switch (position) {
        case 'bottom':
          axis = axisBottom(scale).tickSizeOuter(0);
          transform = `translate(0, ${innerHeight})`;
          break;

        case 'left':
          axis = axisLeft(scale).tickSizeOuter(0);
          transform = `translate(${margin}, 0)`;
          break;

        default:
          break;
      }
      select(g).call(axis);
    }
</script>

<g class="axis" bind:this={g} {transform} />

<style>
  :global(.axis text) {
    color: white;
  }
  @media (prefers-color-scheme: light) {
    :global(.axis text) {
      color: #213547;
    }
  }
</style>

