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

// Initialize Google Sign-In
export const googleSignIn = () => {
  try {
    // Get the client ID from the data attribute
    const googleButton = document.querySelector('.g_id_signin');
    const clientId = googleButton ? googleButton.dataset.clientId : null;

    if (!clientId) {
      console.error('Google Client ID not found in data-client-id attribute');
      showAlert(
        'error',
        'Failed to initialize Google Sign-In: Client ID missing.'
      );
      return;
    }
    google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
    });

    // Render the Google Sign-In button
    if (googleButton) {
      google.accounts.id.renderButton(googleButton, {
        theme: 'outline',
        size: 'large',
        width: 280, // Match your other buttons
      });
      console.log('gis button is rendered');
    }
    console.log('google sign in successful');
  } catch (err) {
    console.error('Error initializing Google Sign-In:', err);
    showAlert(
      'error',
      'Failed to initialize Google Sign-In. Please try again later.'
    );
  }
};

// Handle Google Sign-In response
const handleCredentialResponse = async (response) => {
  try {
    console.log('inside handle credential response');
    const res = await axios({
      method: 'POST',
      url: '/auth/google/callback',
      data: { credential: response.credential },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in with Google successfully!');
      const redirect = new URLSearchParams(window.location.search).get(
        'redirect'
      );
      if (redirect) {
        window.location.href = redirect;
      } else {
        window.setTimeout(() => {
          location.assign('/');
        }, 1500);
      }
    }
  } catch (err) {
    console.error('Error during Google Sign-In:', err);
    showAlert('error', 'Google Sign-In failed. Please try again.');
  }
};
