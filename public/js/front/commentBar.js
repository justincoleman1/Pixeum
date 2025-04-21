/*eslint-disable*/
const commentBar = document.getElementById('post-comment');

if (commentBar) {
  commentBar.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('post-comment').rows = '10';
  });
}

// Handle reply buttons
document.querySelectorAll('.reply-button').forEach((button) => {
  button.addEventListener('click', () => {
    const commentId = button.dataset.commentId;
    const replyForm = document.getElementById(`reply-form-${commentId}`);
    if (replyForm) {
      replyForm.classList.toggle('hidden');
      commentForm.dataset.parentId = commentId;
      document.getElementById('post-comment').focus();
    }
  });
});

// Handle edit buttons
document.querySelectorAll('.edit-button').forEach((button) => {
  button.addEventListener('click', () => {
    const commentId = button.dataset.commentId;
    const editForm = document.getElementById(`edit-form-${commentId}`);
    if (editForm) {
      editForm.classList.toggle('hidden');
      const textarea = editForm.querySelector('textarea');
      textarea.focus();
    }
  });
});
