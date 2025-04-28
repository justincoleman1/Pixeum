/*eslint-disable*/
import axios from 'axios';
import { showAlert } from '../front/alerts';

export const postComment = async (formData, username, slug, parentComment) => {
  try {
    const res = await axios({
      method: 'POST',
      url: `/api/v1/uploads/${username}/${slug}/comments`,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', parentComment ? 'Reply Posted!' : 'Comment Posted!');
      window.setTimeout(() => {
        location.reload();
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const updateComment = async (commentId, content, username, slug) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `/api/v1/uploads/${username}/${slug}/comments/${commentId}`,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Comment Updated!');
      window.setTimeout(() => {
        location.reload();
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const deleteComment = async (commentId, username, slug) => {
  try {
    const res = await axios({
      method: 'DELETE',
      url: `/api/v1/uploads/${username}/${slug}/comments/${commentId}`,
    });

    if (res.status === 204) {
      showAlert('success', 'Comment Deleted!');
      window.setTimeout(() => {
        location.reload();
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const likeComment = async (commentId, uploadPath) => {
  try {
    const res = await fetch(
      `/api/v1${uploadPath}/comments/${commentId}/likeComment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await res.json();
    if (data.status === 'success') {
      document.querySelector(`#comment-like_count-${commentId}`).textContent =
        data.data.like_count;
      document.querySelector(
        `#comment-dislike_count-${commentId}`
      ).textContent = data.data.dislike_count;
    } else {
      console.error('Error liking comment:', data.message);
    }
  } catch (err) {
    console.error('Error:', err);
  }
};

export const dislikeComment = async (commentId, uploadPath) => {
  try {
    const res = await fetch(
      `/api/v1${uploadPath}/comments/${commentId}/dislikeComment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await res.json();
    if (data.status === 'success') {
      document.querySelector(`#comment-like_count-${commentId}`).textContent =
        data.data.like_count;
      document.querySelector(
        `#comment-dislike_count-${commentId}`
      ).textContent = data.data.dislike_count;
    } else {
      console.error('Error disliking comment:', data.message);
    }
  } catch (err) {
    console.error('Error:', err);
  }
};
