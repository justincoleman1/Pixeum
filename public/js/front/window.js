/*eslint-disable*/

import { addHidden, removeHidden } from './hidden';
import {
  showSearchBar,
  hideSearchBar,
  searchBarHidden,
  searchHasText,
  navOptionsHidden,
  showNavOptions,
  hideNavOptions,
  searchIsActive,
  makeSearchInActive,
  revertBtnHidden,
  hideRevertBtn,
  showRevertBtn,
  largeSearchButton,
  smallSearchButton,
  lrgSearchButtonMargin,
  smSearchButtonMargin,
} from './search-bar';
import {
  turnOffOverlay,
  turnOnOverlay,
  overlayActive,
  sideNavHidden,
  sideNavExpanded,
} from './side-nav';

const aside = document.getElementById('aside');
const searchBtn = document.querySelector('.btn-search');

export const ws792 = () => {
  return window.matchMedia('(min-width: 792px)').matches;
};

export const windowSize792Changes = () => {
  //if screen equal or greater than threshold size
  if (ws792()) {
    lrgSearchButtonMargin();
    //if the overlay is active: turn off overlay
    if (overlayActive()) turnOffOverlay();
    //if sidenav is hidden: remove hidden
    if (sideNavHidden()) removeHidden(aside);
    if (searchBarHidden()) {
      showSearchBar();
    }
    if (!searchHasText()) {
      makeSearchInActive();
    }
    if (navOptionsHidden()) showNavOptions();
    hideRevertBtn();
  } else {
    smSearchButtonMargin();
    //screen is less than target threshold
    //If sidenav is active: turn on overlay
    if (sideNavExpanded()) {
      turnOnOverlay();
      removeHidden(aside);
    } else {
      addHidden(aside);
    }
    //If search input has text
    if (searchHasText() || searchIsActive()) {
      smallSearchButton();
      showSearchBar();
      hideNavOptions();
      showRevertBtn();
    } else {
      if (!searchHasText() && !searchIsActive()) {
        largeSearchButton();
        hideSearchBar();
      }
    }
  }
};
