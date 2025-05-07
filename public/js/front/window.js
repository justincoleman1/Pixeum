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
  showAside,
} from './side-nav';

const aside = document.getElementById('aside');

export const ws792 = () => {
  return window.matchMedia('(min-width: 792px)').matches;
};

export const windowSize792Changes = () => {
  // If screen is equal to or greater than threshold size (≥ 792px)
  if (ws792()) {
    lrgSearchButtonMargin();
    // Turn off overlay
    if (overlayActive()) turnOffOverlay();
    // Ensure side nav is visible
    showAside();
    // Show search bar if hidden
    if (searchBarHidden()) {
      showSearchBar();
    }
    // Reset search state if no text
    if (!searchHasText()) {
      makeSearchInActive();
    }
    // Show nav options
    if (navOptionsHidden()) showNavOptions();
    hideRevertBtn();
  } else {
    smSearchButtonMargin();
    // Screen is less than target threshold (< 792px)
    // If side nav is expanded, show it and turn on overlay
    if (sideNavExpanded()) {
      turnOnOverlay();
      removeHidden(aside);
    } else {
      addHidden(aside);
    }
    // If search input has text or search is active
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
