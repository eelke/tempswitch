<script>
  import {
    csv,
    extent,
    scaleLinear,
    scaleTime,
    line,
    curveNatural,
  } from 'd3';

  import { onDestroy, onMount } from 'svelte';
  import Axis from './Axis.svelte';

  export let lowerEdge;
  export let upperEdge;

  let dataset = [];
  const parseRow = (data) => {
    if (data.Temp === '') return null;
    const parsedData = {
      Temp: +data.Temp,
      Time: new Date(data.Time),
      Cooling: data.Cooling,
    };
    return parsedData;
  };

  let loaderInterval;
  onMount(async () => {
    loadData();
    loaderInterval = setInterval(() => {
      loadData();
    }, 10000);
  });
  onDestroy(() => {
    clearInterval(loaderInterval);
  });

  const loadData = async () => {
    dataset = await csv(
      'http://localhost:3000/log',
      parseRow,
    ).then((data) => data);
  };

  $: periods = groupPeriods(dataset);

  // This should probably be a reducer function...
  const groupPeriods = (data) => {
    const result = [];
    let state = null;
    let prevState = null;
    data.forEach((el) => {
      state = el.Cooling;
      if (state === prevState && state === 'ON') {
        result[result.length - 1].push(el);
      } else if (state === 'ON') {
        result.push([]);
      }
      prevState = state;
    });
    return result;
  };

  const margin = {
    top: 15, bottom: 50, left: 50, right: 20,
  };
  const width = 900;
  const height = 600;

  const innerHeight = height - margin.top - margin.bottom;
  const innerWidth = width - margin.left - margin.right;


  $: xScale = scaleTime()
    .domain(extent(dataset, (d) => d.Time))
    .range([0, innerWidth])
    .nice();

  $: yScale = scaleLinear()
    .domain(extent(dataset, (d) => d.Temp))
    .range([innerHeight, 0])
    .nice();

  $: plottedGraph = line()
    .curve(curveNatural)
    .x((d) => xScale(d.Time))
    .y((d) => yScale(d.Temp))(dataset);

  $: plottedCoolingGraphs = periods.map((period) => line()
    .curve(curveNatural)
    .x((d) => xScale(d.Time))
    .y((d) => yScale(d.Temp))(period));

  $: lowerEdgeLine = yScale(lowerEdge);
  $: upperEdgeLine = yScale(upperEdge);



</script>

<main>
  <svg {width} {height}>
    <g transform={`translate(${margin.left},${margin.top})`}>
      <Axis {innerHeight} {margin} scale={xScale} position="bottom" />
      <Axis {innerHeight} {margin} scale={yScale} position="left" />
      <text transform={`translate(${-30},${innerHeight / 2}) rotate(-90)`}
        >Temperature</text
      >
      <line class="lowerEdge" x1={0} y1={lowerEdgeLine} x2={innerWidth} y2={lowerEdgeLine} />
      <line class="upperEdge" x1={0} y1={upperEdgeLine} x2={innerWidth} y2={upperEdgeLine} />

      <path d={plottedGraph} />

      {#each plottedCoolingGraphs as graph}
        <path class="cooling" d={graph} />
      {/each}

      <text x={innerWidth / 2} y={innerHeight + 35}>Timestamp</text>
    </g>
  </svg>
</main>

<style>

  .lowerEdge {
    stroke: blue;
    stroke-width: 1;
    stroke-dasharray: 2px 2px;
  }

  .upperEdge {
    stroke: red;
    stroke-width: 1;
    stroke-dasharray: 2px 2px;
  }



  path, line {
    fill: transparent;
    stroke: rgb(18, 153, 90);
    stroke-width: 2.5;
    stroke-linejoin: round;
  }

  .cooling {
    stroke: rgba(0, 55, 255, 1);
    stroke-width: 5;
    opacity: 1;
  }

  svg {
    width: 100%;
    height: auto;
  }
</style>

