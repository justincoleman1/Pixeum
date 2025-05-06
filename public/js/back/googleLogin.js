/*eslint-disable*/
import axios from 'axios';
import { showAlert } from '../front/alerts';

// Initialize Google Sign-In
export const initializeGoogleSignIn = () => {
  try {
    const googleButton = document.querySelector('.g_id_signin');
    const clientId = googleButton ? googleButton.dataset.clientId : null;

    if (!clientId) {
      console.error('Google Client ID not found in data-client-id attribute');
      showAlert(
        'error',
        'Failed to initialize Google Sign-In: Client ID missing.'
      );
      return false;
    }

    google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
    });
    console.log('Google Sign-In initialized with client ID:', clientId);
    return true;
  } catch (err) {
    console.error('Error initializing Google Sign-In:', err);
    showAlert(
      'error',
      'Failed to initialize Google Sign-In. Please try again later.'
    );
    return false;
  }
};

// Render the Google Sign-In button
export const renderGoogleButton = () => {
  try {
    const googleButton = document.querySelector('.g_id_signin');
    if (!googleButton) {
      console.error('Google Sign-In button element not found');
      return false;
    }

    google.accounts.id.renderButton(googleButton, {
      theme: 'outline',
      size: 'large',
      width: 280,
    });
    console.log('Google Sign-In button rendered');
    return true;
  } catch (err) {
    console.error('Error rendering Google Sign-In button:', err);
    showAlert(
      'error',
      'Failed to render Google Sign-In button. Please try again later.'
    );
    return false;
  }
};

// Handle Google Sign-In response
const handleCredentialResponse = async (response) => {
  console.log('handleCredentialResponse called with response:', response);
  try {
    if (!response.credential) {
      console.error('No credential received from Google Sign-In:', response);
      showAlert('error', 'Google Sign-In failed: No credential received.');
      google.accounts.id.cancel();
      return;
    }

    console.log('Sending ID token to backend:', response.credential);
    console.log('Making axios request to /auth/google/callback');
    const res = await axios({
      method: 'POST',
      url: '/auth/google/callback',
      data: { credential: response.credential },
    });

    console.log('Backend response received:', res.data);
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in with Google successfully!');
      const redirect = new URLSearchParams(window.location.search).get(
        'redirect'
      );
      if (redirect) {
        console.log('Redirecting to:', redirect);
        window.location.href = redirect;
      } else {
        console.log('Redirecting to / after 1500ms');
        window.setTimeout(() => {
          location.assign('/');
        }, 1500);
      }
    } else {
      console.error('Backend returned failure:', res.data);
      showAlert('error', 'Google Sign-In failed: Backend error.');
      google.accounts.id.cancel();
    }
  } catch (err) {
    console.error('Error during Google Sign-In:', err);
    if (err.response) {
      console.error('Backend error response:', err.response.data);
    } else if (err.request) {
      console.error('No response received from backend:', err.request);
    } else {
      console.error('Error setting up request:', err.message);
    }
    showAlert('error', 'Google Sign-In failed. Please try again.');
    google.accounts.id.cancel();
  }
};
