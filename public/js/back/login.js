/*eslint-disable*/
import axios from 'axios';
import { showAlert } from '../front/alerts';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      const redirect = new URLSearchParams(window.location.search).get(
        'redirect'
      );
      if (redirect) {
        window.location.href = redirect;
      } else {
        // No redirect parameter, go to home page
        window.setTimeout(() => {
          location.assign('/');
        }, 1500);
      }
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });
    if ((res.data.status = 'success')) {
      window.setTimeout(() => {
        window.location.href = `/`;
      }, 1500);
    }
  } catch (err) {
    console.log(err.response);
    showAlert('error', 'Error logging out! Try again.');
  }
};
