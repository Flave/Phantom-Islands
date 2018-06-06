import { select as d3_select } from 'd3-selection';
import _template from 'lodash.template';
import template from 'app/templates/oldBrowserInfo.hbs';

const compiledTemplate = _template(template);

export default function BrowserInfo() {
  d3_select('#app')
    .selectAll('.browser-info')
    .data([1])
    .enter()
    .append('div')
    .classed('browser-info', true)
    .html(d => compiledTemplate());
}
