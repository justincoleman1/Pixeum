//esversion: 6
export const addActive = (el) => {
  if (!el.classList.contains('active')) el.classList.add('active');
};

export const removeActive = (el) => {
  if (el.classList.contains('active')) el.classList.remove('active');
};

export const isActive = (el) => el.classList.contains('active');
