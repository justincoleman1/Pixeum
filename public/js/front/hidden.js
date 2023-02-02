//esversion: 6
export const addHidden = (el) => {
  if (
    !el.classList.contains('hidden') &&
    window.matchMedia('(max-width: 791px)').matches
  )
    el.classList.add('hidden');
};

export const removeHidden = (el) => {
  if (el.classList.contains('hidden')) el.classList.remove('hidden');
};
