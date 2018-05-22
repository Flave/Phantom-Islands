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
      .style('opacity', 0);

    popupEnter.transition().style('opacity', 1);

    popup = popupEnter
      .merge(popupUpdate)
      .html(popup => {
        const dX = popup.locationPx.x - popup.x;
        const dY = popup.locationPx.y - popup.y;
        const svgWidth = Math.abs(dX);
        const svgHeight = Math.abs(dY);
        const lineStartX = dX > 0 ? 0 : svgWidth;
        const lineStartY = dY > 0 ? 0 : svgHeight;
        const lineEndX = dX > 0 ? svgWidth : 0;
        const lineEndY = dY > 0 ? svgHeight : 0;
        const svgX = Math.min(dX, 0);
        const svgY = Math.min(dY, 0);

        return compiledTemplate({
          ...popup,
          lineStartX,
          lineStartY,
          lineEndX,
          lineEndY,
          svgWidth,
          svgHeight,
          svgX,
          svgY,
        });
      })
      .each(function(d) {
        d3_select(this)
          .style('left', d => `${d.x - 5}px`)
          .style('top', d => `${d.y - 5}px`);
      });

    popupUpdate
      .exit()
      .transition()
      .style('opacity', 0)
      .remove();
  }
  return _popups;
}
