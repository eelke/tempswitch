<script>
  import {
    csv, extent, scaleLinear, scaleTime, line, curveBasis,
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
    dataset = await csv('http://localhost:3000/log', parseRow).then(
      (data) => data,
    );
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
    top: 15,
    bottom: 50,
    left: 50,
    right: 20,
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
    // Make sure to include the edge temps in the graph scale
    .domain(extent(dataset.concat([{ Temp: lowerEdge }, { Temp: upperEdge }]), (d) => d.Temp))
    .range([innerHeight, 0])
    .nice();

  $: plottedGraph = line()
    .curve(curveBasis)
    .x((d) => xScale(d.Time))
    .y((d) => yScale(d.Temp))(dataset);

  $: plottedCoolingGraphs = periods.map((period) => line()
    .curve(curveBasis)
    .x((d) => xScale(d.Time))
    .y((d) => yScale(d.Temp))(period));

  $: lowerEdgeLine = yScale(lowerEdge);
  $: upperEdgeLine = yScale(upperEdge);
</script>

<main>
  <svg width="{width}" height="{height}" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" >
    <g transform="{`translate(${margin.left},${margin.top})`}">
      <Axis
        innerHeight="{innerHeight}"
        margin="{margin}"
        scale="{xScale}"
        position="bottom"
      />
      <Axis
        innerHeight="{innerHeight}"
        margin="{margin}"
        scale="{yScale}"
        position="left"
      />
      <text transform="{`translate(${-35},${innerHeight / 2}) rotate(-90)`}"
        >Temperature ºC</text
      >
      <line
        class="lowerEdge"
        x1="{0}"
        y1="{lowerEdgeLine}"
        x2="{innerWidth}"
        y2="{lowerEdgeLine}"></line>
      <line
        class="upperEdge"
        x1="{0}"
        y1="{upperEdgeLine}"
        x2="{innerWidth}"
        y2="{upperEdgeLine}"></line>

      {#each plottedCoolingGraphs as graph}
        <path class="cooling" d="{graph}"></path>
      {/each}

      <path d="{plottedGraph}"></path>

      <text x="{innerWidth / 2}" y="{innerHeight + 35}">Time</text>
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

  path {
    fill: transparent;
    stroke: white;

    stroke-width: 2.5;
    stroke-linejoin: round;
  }

  .cooling {
    stroke: rgba(0, 55, 255, 1);
    stroke-width: 10;
    opacity: 1;
  }
  svg {
    width: 100%;
    height: auto;
  }

  text {
    fill: white;
    font-size: 14px;
  }

  @media (prefers-color-scheme: light) {
    path {
      stroke: rgb(18, 153, 90);
    }
    .cooling {
      stroke: rgba(0, 55, 255, 1);
      stroke-width: 5;
      opacity: 0.75;
    }

    text {
      fill: #213547;
    }
  }
</style>
