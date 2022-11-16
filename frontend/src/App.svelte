<script>

  import io from 'socket.io-client';
  // import Papa from 'papaparse';
  import Graph from './lib/Graph.svelte';

  // let data = [];
  let debug = '';
  let temp = 0;
  let lowerEdge = 0;
  let upperEdge = 0;
  let cooling = false;

  // @ts-ignore
  const socket = io.connect('http://localhost:3000/liveData');

  socket.on('new-data', (_data) => {
    debug = JSON.stringify(_data, null, 2);
    temp = _data.temp.toFixed(3);
    lowerEdge = _data.state.ledge;
    upperEdge = _data.state.uedge;
    cooling = _data.state.cooling;
  });

</script>

<div>
  <h1>{temp} &ordm;C</h1>
  <h2>{#if cooling}COOLING DOWN{/if}</h2>
  <h3>Keeping the temperature between {lowerEdge.toFixed(3)}ºC & {upperEdge.toFixed(3)}ºC</h3>
  <!-- <pre style='text-align:left;'>{debug}</pre> -->
</div>

<Graph {lowerEdge} {upperEdge}/>
