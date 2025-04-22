// public/js/comment.js
/*eslint-disable*/
import axios from 'axios';
import { showAlert } from '../front/alerts';

export const postComment = async (
  content,
  username,
  slug,
  parentComment = ''
) => {
  try {
    console.log(content);
    const res = await axios({
      method: 'POST',
      url: `/api/v1/uploads/${username}/${slug}/comments`,
      data: {
        content,
        parentComment,
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
      data: {
        content,
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

const commentBar = document.getElementById('post-comment');

if (commentBar) {
  commentBar.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('post-comment').rows = '10';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const commentForm = document.getElementById('comment-form');
  const urlParts = window.location.pathname.split('/');
  const username = urlParts[1];
  const slug = urlParts[2];

  // Handle main comment form submission
  if (commentForm) {
    commentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Form submitted');
      const content = document.getElementById('post-comment').value;
      const parentComment = commentForm.dataset.parentId || '';
      await postComment(content, username, slug, parentComment);
      commentForm.dataset.parentId = ''; // Reset parent ID
      document.getElementById('post-comment').value = ''; // Clear textarea
    });
  } else {
    console.error('Comment form not found');
  }

  // Handle reply buttons
  document.querySelectorAll('.comment-reply-button').forEach((button) => {
    button.addEventListener('click', () => {
      const commentId = button.dataset.commentId;
      const replyForm = document.getElementById(`reply-section-${commentId}`);
      if (replyForm) {
        replyForm.classList.toggle('hidden');
        commentForm.dataset.parentId = commentId;
        document.getElementById('post-comment').focus();
      }
    });
  });

  // Handle reply form submissions
  document.querySelectorAll('.reply-form').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const commentId = form.dataset.commentId;
      const content = form.querySelector('textarea').value;
      await postComment(content, username, slug, commentId);
    });
  });

  // Handle edit buttons
  document.querySelectorAll('.comment-edit-button').forEach((button) => {
    button.addEventListener('click', () => {
      const commentId = button.dataset.commentId;
      const editForm = document.getElementById(`edit-section-${commentId}`);
      if (editForm) {
        editForm.classList.toggle('hidden');
        const textarea = editForm.querySelector('textarea');
        textarea.focus();
      }
    });
  });

  // Handle edit form submissions
  document.querySelectorAll('.edit-comment-form').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const commentId = form.dataset.commentId;
      const content = form.querySelector('textarea').value;
      await updateComment(commentId, content, username, slug);
    });
  });

  // Handle delete buttons
  document.querySelectorAll('.comment-delete-button').forEach((button) => {
    button.addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete this comment?')) {
        const commentId = button.dataset.commentId;
        await deleteComment(commentId, username, slug);
      }
    });
  });

  // Upvote and Downvote Functionality
  const likeButtons = document.querySelectorAll('.comment-like-button');
  likeButtons.forEach((button) => {
    button.addEventListener('click', async (e) => {
      console.log('Like Button Clicked');
      const commentId = e.target.closest('button').dataset.commentId;
      const uploadPath = window.location.pathname;
      console.log('Whats This');
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
          document.querySelector(
            `#comment-like_count-${commentId}`
          ).textContent = data.data.like_count;
          document.querySelector(
            `#comment-dislike_count-${commentId}`
          ).textContent = data.data.dislike_count;
        } else {
          console.error('Error liking comment:', data.message);
        }
      } catch (err) {
        console.error('Error:', err);
      }
    });
  });

  const dislikeButtons = document.querySelectorAll('.comment-dislike-button');
  dislikeButtons.forEach((button) => {
    button.addEventListener('click', async (e) => {
      const commentId = e.target.closest('button').dataset.commentId;
      const uploadPath = window.location.pathname;

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
          document.querySelector(
            `#comment-like_count-${commentId}`
          ).textContent = data.data.like_count;
          document.querySelector(
            `#comment-dislike_count-${commentId}`
          ).textContent = data.data.dislike_count;
        } else {
          console.error('Error disliking comment:', data.message);
        }
      } catch (err) {
        console.error('Error:', err);
      }
    });
  });
});
