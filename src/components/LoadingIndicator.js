import { autorun } from 'mobx';
import { select as d3_select } from 'd3';
import uiState from 'app/uiState';

export default function LoadingIndicator() {
  let parent;
  let loadingIndicator;
  let loadingIndicatorEnter;
  let loadingIndicatorUpdate;
  let data;

  function _loadingIndicator() {
    const { pendingRequests } = uiState;
    let className = 'header__loading-indicator header__item';
    parent = d3_select('#header');
    data = pendingRequests.length ? [1] : [];
    loadingIndicatorUpdate = parent
      .selectAll('.header__loading-indicator')
      .data(data);
    loadingIndicatorEnter = loadingIndicatorUpdate.enter().append('div');

    loadingIndicator = loadingIndicatorEnter
      .merge(loadingIndicatorUpdate)
      .attr('class', className)
      .html(`Loading…`);

    loadingIndicatorUpdate.exit().remove();
  }

  autorun(_loadingIndicator);
  return _loadingIndicator;
}
