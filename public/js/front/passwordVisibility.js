//esversion:6

export const togglePasswordVisibillity = () => {
  const x = document.getElementById('password');
  const y = document.getElementById('passwordConfirm');

  if (x.type === 'password') x.type = 'text';
  else x.type = 'password';

  if (y) {
    if (y.type === 'password') y.type = 'text';
    else y.type = 'password';
  }
};
