// public/js/comment.js
/*eslint-disable*/
import axios from 'axios';
import { showAlert } from '../front/alerts';

var gk_isXlsx = false;
var gk_xlsxFileLookup = {};
var gk_fileData = {};

function filledCell(cell) {
  return cell !== '' && cell != null;
}

function loadFileData(filename) {
  if (gk_isXlsx && gk_xlsxFileLookup[filename]) {
    try {
      var workbook = XLSX.read(gk_fileData[filename], { type: 'base64' });
      var firstSheetName = workbook.SheetNames[0];
      var worksheet = workbook.Sheets[firstSheetName];

      var jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        blankrows: false,
        defval: '',
      });
      var filteredData = jsonData.filter((row) => row.some(filledCell));

      var headerRowIndex = filteredData.findIndex(
        (row, index) =>
          row.filter(filledCell).length >=
          filteredData[index + 1]?.filter(filledCell).length
      );
      if (headerRowIndex === -1 || headerRowIndex > 25) {
        headerRowIndex = 0;
      }

      var csv = XLSX.utils.aoa_to_sheet(filteredData.slice(headerRowIndex));
      csv = XLSX.utils.sheet_to_csv(csv, { header: 1 });
      return csv;
    } catch (e) {
      console.error(e);
      return '';
    }
  }
  return gk_fileData[filename] || '';
}

const form = document.getElementById('comment-form');
const fileInput = document.getElementById('media-upload');
const uploadButton = document.getElementById('comment-image');
const editor = document.getElementById('comment-editor');
let activeTrashButton = null;

// Function to position cursor after an element
function positionCursorAfter(element) {
  const range = document.createRange();
  const selection = window.getSelection();
  range.setStartAfter(element);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  editor.focus();
}

// Function to create trash button
function createTrashButton(container) {
  const trashButton = document.createElement('button');
  trashButton.className = 'trash-button';
  trashButton.innerHTML = `<img src="/img/svg/trash.svg" class="cbsz" alt="Trash icon">`;
  trashButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    container.remove();
    activeTrashButton = null;
    container.contentEditable = 'true';
  });
  return trashButton;
}

// Function to hide all trash buttons
function hideAllTrashButtons() {
  const trashButtons = editor.querySelectorAll('.trash-button');
  trashButtons.forEach((button) => {
    button.classList.remove('active');
  });
  activeTrashButton = null;
}

// Trigger file input click when custom button is clicked
uploadButton.addEventListener('click', () => {
  fileInput.click();
});

// Handle file selection and embed in editor
fileInput.addEventListener('change', () => {
  const files = fileInput.files;

  for (const file of files) {
    // Create a container div for each media item
    const container = document.createElement('div');
    container.className = 'media-container';
    container.contentEditable = 'true';

    // Add trash button
    const trashButton = createTrashButton(container);
    container.appendChild(trashButton);

    // Show trash button on container click
    container.addEventListener('click', (e) => {
      e.stopPropagation();
      hideAllTrashButtons();
      trashButton.classList.add('active');
      activeTrashButton = trashButton;
      if (container.contentEditable === 'false') {
        container.contentEditable = 'true';
        positionCursorAfter(container);
      } else container.contentEditable = 'false';
    });

    // Handle Excel files
    if (file.name.endsWith('.xlsx')) {
      gk_isXlsx = true;
      gk_xlsxFileLookup[file.name] = true;
      const reader = new FileReader();
      reader.onload = (event) => {
        gk_fileData[file.name] = event.target.result.split(',')[1];
        const csv = loadFileData(file.name);
        const pre = document.createElement('pre');
        pre.textContent = csv || 'Error processing Excel file';
        container.appendChild(pre);
        editor.appendChild(container);
        positionCursorAfter(container);
      };
      reader.readAsDataURL(file);
    }
    // Handle images and GIFs
    else if (file.type.startsWith('image/') || file.type === 'image/gif') {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.alt = file.name;
      img.dataset.fileName = file.name;
      container.appendChild(img);
      editor.appendChild(container);
      positionCursorAfter(container);
    } else {
      alert('Please upload only images, GIFs, or Excel (.xlsx) files.');
    }
  }

  // Clear file input
  fileInput.value = '';
});

// Hide trash button when clicking outside media
editor.addEventListener('click', () => {
  hideAllTrashButtons();
  editor.focus();
});

// Handle form submission
form.addEventListener('submit', (e) => {
  e.preventDefault();

  // Extract text, images, and Excel data from editor
  const images = editor.querySelectorAll('img');
  const excelPre = editor.querySelectorAll('pre');
  const files = Array.from(images).map((img) => ({
    name: img.dataset.fileName,
    src: img.src,
  }));
  const excelData = Array.from(excelPre).map((pre) => ({
    name: 'excel-data',
    content: pre.textContent,
  }));
  const textContent = Array.from(editor.childNodes)
    .map((node) => {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent;
      if (node.tagName === 'IMG') return `[IMG:${node.dataset.fileName}]`;
      if (node.tagName === 'PRE') return `[EXCEL:${node.textContent}]`;
      return '';
    })
    .join('');

  // Log form data (replace with backend submission logic)
  console.log('Text Content:', textContent);
  console.log('Images:', files);
  console.log('Excel Data:', excelData);

  // For backend submission, create FormData
  const formData = new FormData();
  formData.append('comment', textContent);
  files.forEach((file, index) => {
    formData.append(`media-${index}`, file.src);
  });
  excelData.forEach((data, index) => {
    formData.append(`excel-${index}`, data.content);
  });

  // Example: Send to backend (uncomment and replace with your endpoint)
  /*
    fetch('/your-backend-endpoint', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => console.log('Success:', data))
    .catch(error => console.error('Error:', error));
    */

  // Reset editor
  editor.innerHTML = '';
  alert('Comment submitted! (Check console for details)');
});

// Maintain cursor focus after inserting content
editor.addEventListener('click', () => {
  editor.focus();
});

// export const postComment = async (
//   content,
//   username,
//   slug,
//   parentComment = ''
// ) => {
//   try {
//     console.log(content);
//     const res = await axios({
//       method: 'POST',
//       url: `/api/v1/uploads/${username}/${slug}/comments`,
//       data: {
//         content,
//         parentComment,
//       },
//     });

//     if (res.data.status === 'success') {
//       showAlert('success', parentComment ? 'Reply Posted!' : 'Comment Posted!');
//       window.setTimeout(() => {
//         location.reload();
//       }, 1500);
//     }
//   } catch (err) {
//     showAlert('error', err.response.data.message);
//   }
// };

// export const updateComment = async (commentId, content, username, slug) => {
//   try {
//     const res = await axios({
//       method: 'PATCH',
//       url: `/api/v1/uploads/${username}/${slug}/comments/${commentId}`,
//       data: {
//         content,
//       },
//     });

//     if (res.data.status === 'success') {
//       showAlert('success', 'Comment Updated!');
//       window.setTimeout(() => {
//         location.reload();
//       }, 1500);
//     }
//   } catch (err) {
//     showAlert('error', err.response.data.message);
//   }
// };

// export const deleteComment = async (commentId, username, slug) => {
//   try {
//     const res = await axios({
//       method: 'DELETE',
//       url: `/api/v1/uploads/${username}/${slug}/comments/${commentId}`,
//     });

//     if (res.status === 204) {
//       showAlert('success', 'Comment Deleted!');
//       window.setTimeout(() => {
//         location.reload();
//       }, 1500);
//     }
//   } catch (err) {
//     showAlert('error', err.response.data.message);
//   }
// };

const commentBar = document.getElementById('comment-editor');

if (commentBar) {
  commentBar.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('clicked comment bar');
    document.getElementById('comment-editor').style.minHeight = '200px';
  });
}

// document.addEventListener('DOMContentLoaded', () => {
//   const commentForm = document.getElementById('comment-form');
//   const urlParts = window.location.pathname.split('/');
//   const username = urlParts[1];
//   const slug = urlParts[2];

//   // Handle main comment form submission
//   // if (commentForm) {
//   //   commentForm.addEventListener('submit', async (e) => {
//   //     e.preventDefault();
//   //     console.log('Form submitted');
//   //     const content = document.getElementById('comment-editor').value;
//   //     const parentComment = commentForm.dataset.parentId || '';
//   //     await postComment(content, username, slug, parentComment);
//   //     commentForm.dataset.parentId = ''; // Reset parent ID
//   //     document.getElementById('comment-editor').value = ''; // Clear textarea
//   //   });
//   // } else {
//   //   console.error('Comment form not found');
//   // }

//   // Handle reply buttons
//   document.querySelectorAll('.comment-reply-button').forEach((button) => {
//     button.addEventListener('click', () => {
//       const commentId = button.dataset.commentId;
//       const replyForm = document.getElementById(`reply-section-${commentId}`);
//       if (replyForm) {
//         replyForm.classList.toggle('hidden');
//         commentForm.dataset.parentId = commentId;
//         document.getElementById('comment-editor').focus();
//       }
//     });
//   });

//   // Handle reply form submissions
//   document.querySelectorAll('.reply-form').forEach((form) => {
//     form.addEventListener('submit', async (e) => {
//       e.preventDefault();
//       const commentId = form.dataset.commentId;
//       const content = form.querySelector('textarea').value;
//       await postComment(content, username, slug, commentId);
//     });
//   });

//   // Handle edit buttons
//   document.querySelectorAll('.comment-edit-button').forEach((button) => {
//     button.addEventListener('click', () => {
//       const commentId = button.dataset.commentId;
//       const editForm = document.getElementById(`edit-section-${commentId}`);
//       if (editForm) {
//         editForm.classList.toggle('hidden');
//         const textarea = editForm.querySelector('textarea');
//         textarea.focus();
//       }
//     });
//   });

//   // Handle edit form submissions
//   document.querySelectorAll('.edit-comment-form').forEach((form) => {
//     form.addEventListener('submit', async (e) => {
//       e.preventDefault();
//       const commentId = form.dataset.commentId;
//       const content = form.querySelector('textarea').value;
//       await updateComment(commentId, content, username, slug);
//     });
//   });

//   // Handle delete buttons
//   document.querySelectorAll('.comment-delete-button').forEach((button) => {
//     button.addEventListener('click', async () => {
//       if (confirm('Are you sure you want to delete this comment?')) {
//         const commentId = button.dataset.commentId;
//         await deleteComment(commentId, username, slug);
//       }
//     });
//   });

//   // Upvote and Downvote Functionality
//   const likeButtons = document.querySelectorAll('.comment-like-button');
//   likeButtons.forEach((button) => {
//     button.addEventListener('click', async (e) => {
//       console.log('Like Button Clicked');
//       const commentId = e.target.closest('button').dataset.commentId;
//       const uploadPath = window.location.pathname;
//       console.log('Whats This');
//       try {
//         const res = await fetch(
//           `/api/v1${uploadPath}/comments/${commentId}/likeComment`,
//           {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//             },
//           }
//         );

//         const data = await res.json();
//         if (data.status === 'success') {
//           document.querySelector(
//             `#comment-like_count-${commentId}`
//           ).textContent = data.data.like_count;
//           document.querySelector(
//             `#comment-dislike_count-${commentId}`
//           ).textContent = data.data.dislike_count;
//         } else {
//           console.error('Error liking comment:', data.message);
//         }
//       } catch (err) {
//         console.error('Error:', err);
//       }
//     });
//   });

//   const dislikeButtons = document.querySelectorAll('.comment-dislike-button');
//   dislikeButtons.forEach((button) => {
//     button.addEventListener('click', async (e) => {
//       const commentId = e.target.closest('button').dataset.commentId;
//       const uploadPath = window.location.pathname;

//       try {
//         const res = await fetch(
//           `/api/v1${uploadPath}/comments/${commentId}/dislikeComment`,
//           {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//             },
//           }
//         );

//         const data = await res.json();
//         if (data.status === 'success') {
//           document.querySelector(
//             `#comment-like_count-${commentId}`
//           ).textContent = data.data.like_count;
//           document.querySelector(
//             `#comment-dislike_count-${commentId}`
//           ).textContent = data.data.dislike_count;
//         } else {
//           console.error('Error disliking comment:', data.message);
//         }
//       } catch (err) {
//         console.error('Error:', err);
//       }
//     });
//   });
// });
