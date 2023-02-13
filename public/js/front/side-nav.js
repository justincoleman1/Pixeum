/* eslint-disable */
import { addHidden, removeHidden } from './hidden';

const ws791 = window.matchMedia('(max-width: 791px)');
const overlay = document.querySelector('.overlay');
const el = document.getElementById('main');
const el1 = document.getElementById('aside');
const el2 = document.getElementById('upload-main');
const el4 = document.getElementById('sidenavitem3');
const el5 = document.getElementById('sidenavitem4');
const el6 = document.getElementById('sidenavitem5');
const el7 = document.getElementById('sidenavitem6');

export const asideDisappear = () => {
  el1.classList.add('disappear');
};
export const asideAppear = () => {
  el1.classList.remove('disappear');
};

export const mainDisappear = () => {
  el.classList.add('disappear');
};

export const hideAside = () => {
  el1.classList.add('hidden');
};

export const sideNavHidden = () => {
  return el1.classList.contains('hidden') ? true : false;
};

export const sideNavExpanded = () => {
  return el1.classList.contains('expand-aside') ? true : false;
};

export const mainCollapsed = () => {
  if (el) return el.classList.contains('shrink-main') ? true : false;
  return null;
};

export const uploadMainCollapsed = () => {
  if (el2) return el2.classList.contains('shrink-main') ? true : false;
  return null;
};

export const overlayActive = () => {
  return overlay.classList.contains('active') ? true : false;
};

export const turnOffOverlay = () => {
  if (overlayActive()) overlay.classList.remove('active');
  if (el2) overlay.style.marginTop = '0';
};

export const turnOnOverlay = () => {
  if (ws791.matches) {
    if (!overlayActive()) overlay.classList.add('active');
    if (el2) overlay.style.marginTop = '5em';
  }
};

const expandSideNavChildren = () => {
  if (el2) el2.classList.add('shrink-main');
  else el.classList.add('shrink-main');
  el1.classList.add('expand-aside');

  if (el4) el4.classList.remove('hidden');
  el5.classList.remove('hidden');
  el6.classList.remove('hidden');
  el7.classList.remove('hidden');

  for (let i = 0; i < 4; i++) {
    if (i < 3) {
      document
        .getElementById('sidenavitem1')
        .firstChild.children[i].classList.remove('center-side-nav-link');
      document
        .getElementById('sidenavitem1')
        .firstChild.children[i].firstChild.classList.remove(
          'shrink-side-nav-link'
        );
    }
    document
      .getElementById('sidenavitem2')
      .firstChild.children[i].classList.remove('center-side-nav-link');
    document
      .getElementById('sidenavitem2')
      .firstChild.children[i].firstChild.classList.remove(
        'shrink-side-nav-link'
      );
  }
};

const collapseSideNavChildren = () => {
  if (el2) el2.classList.remove('shrink-main');
  else el.classList.remove('shrink-main');

  el1.classList.remove('expand-aside');

  if (el4) el4.classList.add('hidden');
  el5.classList.add('hidden');
  el6.classList.add('hidden');
  el7.classList.add('hidden');

  for (let i = 0; i < 4; i++) {
    if (i < 3) {
      document
        .getElementById('sidenavitem1')
        .firstChild.children[i].classList.add('center-side-nav-link');
      document
        .getElementById('sidenavitem1')
        .firstChild.children[i].firstChild.classList.add(
          'shrink-side-nav-link'
        );
    }
    document
      .getElementById('sidenavitem2')
      .firstChild.children[i].classList.add('center-side-nav-link');
    document
      .getElementById('sidenavitem2')
      .firstChild.children[i].firstChild.classList.add('shrink-side-nav-link');
  }
};

export const expandSideNav = () => {
  if (el2) asideAppear();
  expandSideNavChildren();
  turnOnOverlay();
  removeHidden(el1);
};

export const collapseSideNav = () => {
  if (el2) asideDisappear();
  collapseSideNavChildren();
  turnOffOverlay();
  addHidden(el1);
};
