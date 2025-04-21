//esversion: 6
export const addHidden = (el) => {
  if (!el.classList.contains('hidden')) el.classList.add('hidden');
};

export const removeHidden = (el) => {
  if (el.classList.contains('hidden')) el.classList.remove('hidden');
};
