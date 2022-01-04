import { select as d3_select } from 'd3-selection';
import _template from 'lodash.template';
import template from 'app/templates/MobileInfo.hbs';
import uiState from 'app/uiState';
import { autorun } from 'mobx';

const compiledTemplate = _template(template);

export default function MobileInfo(hasWebAudio) {
  const _info = () => {
    const info = d3_select('#app')
      .selectAll('.mobile-info')
      .data(uiState.showMobileInfo ? [1] : []);

    info
      .enter()
      .append('div')
      .classed('mobile-info', true)
      .html(d => compiledTemplate({ hasWebAudio }))
      .select('.info__start')
      .on('click', () => uiState.setShowMobileInfo(false));

    info.exit().remove();
  };

  autorun(_info);
  _info();
}
