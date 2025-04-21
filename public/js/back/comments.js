/*eslint-disable*/
import axios from 'axios';
import { showAlert } from '../front/alerts';

export const postComment = async (content, username, slug) => {
  try {
    const res = await axios({
      method: 'POST',
      url: `/api/v1/uploads/${username}/${slug}/comments`,
      data: { content },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Comment Posted!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    console.log('ERROR!!!!!');
    showAlert('error', err.response.data.message);
  }
};
