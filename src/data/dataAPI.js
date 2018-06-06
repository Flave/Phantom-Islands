import { json as d3_json } from 'd3-fetch';

class API {
  load(cb) {
    d3_json('./data/islands_specs.json').then((data, err) => {
      if (!err) cb(data);
      else console.log(err);
    });
  }
}

export default new API();
