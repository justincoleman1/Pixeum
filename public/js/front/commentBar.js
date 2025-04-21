/*eslint-disable*/
const commentBar = document.getElementById('post-comment');

if (commentBar) {
  commentBar.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('post-comment').rows = '10';
  });
}
