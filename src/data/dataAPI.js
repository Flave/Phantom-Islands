import { json as d3Json } from 'd3';
import islandSpecs from './islands_specs.json';

class API {
  load(cb) {
    d3Json(islandSpecs).then((data, err) => {
      if (!err) cb(data);
      else console.log(err);
    });
  }
}

export default new API();
