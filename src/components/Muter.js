import { autorun } from 'mobx';
import { select as d3_select } from 'd3';
import uiState from 'app/uiState';

export default function Muter() {
  let parent;
  let muter;
  let muterEnter;
  let muterUpdate;

  function _muter() {
    const { muted } = uiState;

    parent = d3_select('#header');

    muterUpdate = parent.selectAll('.header__muter').data([1]);

    muterEnter = muterUpdate
      .enter()
      .append('div')
      .classed('header__muter', true);

    muter = muterEnter.merge(muterUpdate).html(muted ? `Unmute` : `Mute`);

    muter.on('click', () => uiState.setMuted(!uiState.muted));

    muterUpdate.exit().remove();
  }

  autorun(_muter);
  return _muter;
}
