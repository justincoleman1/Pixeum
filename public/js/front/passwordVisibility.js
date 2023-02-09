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

export const toggleUpdatePasswordVisibillity = () => {
  const x = document.getElementById('password-current');
  const y = document.getElementById('update-password');
  const z = document.getElementById('password-confirm');

  if (x.type === 'password') x.type = 'text';
  else x.type = 'password';

  if (y) {
    if (y.type === 'password') y.type = 'text';
    else y.type = 'password';
  }

  if (z) {
    if (z.type === 'password') z.type = 'text';
    else z.type = 'password';
  }
};
