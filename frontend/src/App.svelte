<script>

  import io from 'socket.io-client';

  let data = null;
  let debug = '';
  let temp = 0;
  let lowerEdge = 0;
  let upperEdge = 0;
  let cooling = false;

  const socket = io.connect('http://localhost:3000/liveData');

  socket.on('new-data', (_data) => {
    data = _data;
    debug = JSON.stringify(_data, null, 2);
    temp = data.temp.toFixed(3);
    lowerEdge = data.state.ledge;
    upperEdge = data.state.uedge;
    cooling = data.state.cooling;
  });

</script>

<div>

  <h1>{temp} &ordm;C</h1>
  <h2>{#if cooling}COOLING DOWN{/if}</h2>
  <h3>Keeping the temperature between {lowerEdge.toFixed(3)}ºC & {upperEdge.toFixed(3)}ºC</h3>
  <pre style='text-align:left;'>{debug}</pre>
</div>
