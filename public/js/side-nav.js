/* eslint-disable */
import { addHidden, removeHidden } from './hidden';

const ws791 = window.matchMedia('(max-width: 791px)');
const el = document.getElementById('main');
const el1 = document.getElementById('aside');
const sideNavBtn = document.getElementById('side-nav-btn');
const overlay = document.querySelector('.overlay');

const el2 = document.getElementById('sidenavitem1');
const el3 = document.getElementById('sidenavitem2');

const el2c = document.getElementById('sidenavitem1').firstChild;
const el3c = document.getElementById('sidenavitem2').firstChild;

const el4 = document.getElementById('sidenavitem3');
const el5 = document.getElementById('sidenavitem4');
const el6 = document.getElementById('sidenavitem5');
const el7 = document.getElementById('sidenavitem6');

export const turnOffOverlay = () => {
  if (overlay.classList.contains('active')) overlay.classList.remove('active');
};

export const turnOnOverlay = () => {
  if (ws791.matches)
    if (!overlay.classList.contains('active')) overlay.classList.add('active');
};

const expandSideNavChildren = () => {
  el.classList.add('shrink-main');
  el1.classList.add('expand-aside');
  el4.classList.remove('hidden');
  el5.classList.remove('hidden');
  el6.classList.remove('hidden');
  el7.classList.remove('hidden');
  el2.classList.remove('shrink-side-nav-item');
  el3.classList.remove('shrink-side-nav-item');

  for (let i = 0; i < 4; i++) {
    if (i < 3) {
      el2c.children[i].classList.remove('center-side-nav-link');
      el2c.children[i].firstChild.classList.remove('shrink-side-nav-link');
    }
    el3c.children[i].classList.remove('center-side-nav-link');
    el3c.children[i].firstChild.classList.remove('shrink-side-nav-link');
  }
};

const collapseSideNavChildren = () => {
  el.classList.remove('shrink-main');
  el1.classList.remove('expand-aside');
  el4.classList.add('hidden');
  el5.classList.add('hidden');
  el6.classList.add('hidden');
  el7.classList.add('hidden');
  el2.classList.add('shrink-side-nav-item');
  el3.classList.add('shrink-side-nav-item');

  for (let i = 0; i < 4; i++) {
    if (i < 3) {
      el2c.children[i].classList.add('center-side-nav-link');
      el2c.children[i].firstChild.classList.add('shrink-side-nav-link');
    }
    el3c.children[i].classList.add('center-side-nav-link');
    el3c.children[i].firstChild.classList.add('shrink-side-nav-link');
  }
};

export const expandSideNav = () => {
  expandSideNavChildren();
  turnOnOverlay();
  removeHidden(el1);
};

export const collapseSideNav = () => {
  collapseSideNavChildren();
  turnOffOverlay();
  addHidden(el1);
};
