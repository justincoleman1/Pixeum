//esversion: 6
const body = document.querySelector('body');

export const w = 'keydown';
export const g = 'keyup';
export const sh = 'contextmenu';

export const h = (event) => {
  if (event.keyCode === 44) body.classList.add('hidden');
};

export const s = () => {
  if (body.classList.contains('hidden')) body.classList.remove('hidden');
};

export const p = (event) => {
  if (event.target.localName === 'img' || event.target.localName === 'label')
    event.preventDefault();
};
