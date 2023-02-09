//esversion:6
export const disallowBodyScroll = () => {
  document.body.style.overflow = 'hidden';
};

export const allowBodyScroll = () => {
  const scrollY = document.body.style.top;
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  window.scrollTo(0, parseInt(scrollY || '0') * -1);
};
