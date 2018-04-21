import { autorun } from 'mobx';
import { select as d3_select } from 'd3';
import _template from 'lodash/template';
import template from 'app/templates/popup.hbs';

import uiState from 'app/uiState';

const compiledTemplate = _template(template);

export default function Popups() {
  let parent;
  let popup;
  let popupEnter;
  let popupUpdate;

  function _popups(map) {
    parent = d3_select(map.getContainer())
      .append('div')
      .classed('popups', true);
    autorun(update);
  }

  function update() {
    const { popupCandidate } = uiState;

    popupUpdate = parent
      .selectAll('.map-popup')
      .data(popupCandidate ? [popupCandidate] : []);

    popupEnter = popupUpdate
      .enter()
      .append('div')
      .classed('map-popup', true)
      .html(d => compiledTemplate(d));

    popup = popupEnter.merge(popupUpdate).each(function(d) {
      const width = this.offsetWidth;
      const height = this.offsetHeight;
      const x = Math.floor(d.locationPx.x - width / 2);
      const y = Math.floor(d.locationPx.y - height);

      d3_select(this)
        .style('left', d => `${x}px`)
        .style('top', d => `${y}px`);
    });

    popupUpdate.exit().remove();
  }
  return _popups;
}
