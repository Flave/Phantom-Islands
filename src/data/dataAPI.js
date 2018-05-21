import { json as d3Json } from 'd3';

class API {
  load(cb) {
    d3Json('./data/islands_specs.json').then((data, err) => {
      if (!err) cb(data);
      else console.log(err);
    });
  }
}

export default new API();
