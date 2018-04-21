import { autorun } from 'mobx';
import { select as d3_select } from 'd3';

import uiState from 'app/uiState';

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
      .selectAll('.popup')
      .data(popupCandidate ? [popupCandidate] : []);

    popupEnter = popupUpdate
      .enter()
      .append('div')
      .classed('popup', true)
      .html(d => `<span>${d.name}</span>`);

    popup = popupEnter
      .merge(popupUpdate)
      .style('left', d => `${d.locationPx.x}px`)
      .style('top', d => `${d.locationPx.y}px`);

    popupUpdate.exit().remove();
  }
  return _popups;
}
