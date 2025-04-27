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
let elements = []; // Track ordered elements

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

// Function to insert a newline after an element
function insertNewlineAfter(element) {
  const br = document.createElement('br');
  element.insertAdjacentElement('afterend', br);
  positionCursorAfter(br);
}

// Function to create trash button
function createTrashButton(container, index) {
  const trashButton = document.createElement('button');
  trashButton.className = 'trash-button';
  trashButton.innerHTML = `<img src="/img/svg/trash.svg" class="cbsz" alt="Trash icon">`;
  trashButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    container.remove();
    activeTrashButton = null;
    // Remove the <br> element following the container if it exists
    const nextSibling = container.nextSibling;
    if (nextSibling && nextSibling.tagName === 'BR') {
      nextSibling.remove();
    }
    // Remove the element from the elements array
    elements = elements.filter((_, i) => i !== index);
    editor.focus();
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
    container.contentEditable = 'false'; // Prevent typing inside the media container

    // Add trash button
    const mediaIndex = elements.length;
    const trashButton = createTrashButton(container, mediaIndex);
    container.appendChild(trashButton);

    // Show trash button on container click
    container.addEventListener('click', (e) => {
      e.stopPropagation();
      hideAllTrashButtons();
      trashButton.classList.add('active');
      activeTrashButton = trashButton;
      // Position cursor after the container (after the <br>)
      const nextSibling = container.nextSibling;
      if (nextSibling && nextSibling.tagName === 'BR') {
        positionCursorAfter(nextSibling);
      } else {
        insertNewlineAfter(container);
      }
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
        elements.push({ type: 'excel', value: file.name, file });
        insertNewlineAfter(container);
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
      elements.push({
        type: file.type.includes('gif') ? 'gif' : 'image',
        value: file.name,
        file,
      });
      insertNewlineAfter(container);
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

// Handle keydown to capture text on Enter
editor.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    // Capture the text before the newline
    const textBefore = captureTextBeforeCursor();
    if (textBefore.trim()) {
      elements.push({ type: 'text', value: textBefore.trim() });
    }
  }
});

// Function to capture text before the cursor
function captureTextBeforeCursor() {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return '';

  const range = selection.getRangeAt(0);
  const startContainer = range.startContainer;
  const startOffset = range.startOffset;

  let text = '';
  // If the cursor is in a text node, get the text before the cursor
  if (startContainer.nodeType === Node.TEXT_NODE) {
    text = startContainer.textContent.substring(0, startOffset);
  } else if (startContainer === editor) {
    // If the cursor is directly in the editor, collect text from previous nodes
    const children = Array.from(editor.childNodes);
    const cursorNodeIndex = children.findIndex((node) => {
      const nodeRange = document.createRange();
      nodeRange.selectNode(node);
      return nodeRange.compareBoundaryPoints(Range.END_TO_START, range) >= 0;
    });

    for (let i = 0; i < cursorNodeIndex; i++) {
      const node = children[i];
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (node.tagName === 'BR') {
        text += '\n';
      }
    }
  }

  return text;
}

// Handle form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Capture any remaining text before submission
  const textBefore = captureTextBeforeCursor();
  if (textBefore.trim()) {
    elements.push({ type: 'text', value: textBefore.trim() });
  }

  // Capture text after media containers and <br> tags
  const children = Array.from(editor.childNodes);
  let currentText = '';
  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    if (node.nodeType === Node.TEXT_NODE) {
      currentText += node.textContent;
    } else if (node.tagName === 'BR') {
      if (currentText.trim()) {
        elements.push({ type: 'text', value: currentText.trim() });
        currentText = '';
      }
    } else if (node.classList && node.classList.contains('media-container')) {
      if (currentText.trim()) {
        elements.push({ type: 'text', value: currentText.trim() });
        currentText = '';
      }
      // Media elements are already in the elements array
    }
  }
  // Add any remaining text
  if (currentText.trim()) {
    elements.push({ type: 'text', value: currentText.trim() });
  }

  // Log the ordered elements
  console.log('Ordered Elements:', elements);

  // Prepare FormData for Axios request
  const formData = new FormData();
  formData.append('elements', JSON.stringify(elements));
  elements.forEach((element, index) => {
    if (
      element.type === 'image' ||
      element.type === 'gif' ||
      element.type === 'excel'
    ) {
      formData.append(`media-${index}`, element.file);
    }
  });

  // Get username and slug from URL
  const urlParts = window.location.pathname.split('/');
  const username = urlParts[1];
  const slug = urlParts[2];
  const parentComment = form.dataset.parentId || '';

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

  // Reset editor
  editor.innerHTML = '';
  elements = [];
  form.dataset.parentId = ''; // Reset parent ID
});

// Maintain cursor focus after inserting content
editor.addEventListener('click', () => {
  editor.focus();
});

// Handle click on comment media to open modal
document.addEventListener('click', (e) => {
  const media = e.target.closest('.comment-media');
  if (media) {
    const modal = document.getElementById('comment-media-modal');
    const modalImage = document.getElementById('comment-media-modal-image');
    const overlay = document.getElementById('comment-media-modal-overlay');

    // Set the image source and show the modal
    modalImage.src = media.src;
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
  }

  // Close modal when clicking the close button or overlay
  const closeButton = e.target.closest('#comment-media-modal-close-btn');
  const overlay = e.target.closest('#comment-media-modal-overlay');
  if (closeButton || overlay) {
    const modal = document.getElementById('comment-media-modal');
    const modalImage = document.getElementById('comment-media-modal-image');
    const overlay = document.getElementById('comment-media-modal-overlay');

    modal.classList.add('hidden');
    overlay.classList.add('hidden');
    modalImage.src = ''; // Clear the image source
  }
});

const commentBar = document.getElementById('comment-editor');

if (commentBar) {
  commentBar.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('clicked comment bar');
    document.getElementById('comment-editor').style.minHeight = '200px';
  });
}

//

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

document.addEventListener('DOMContentLoaded', () => {
  const commentForm = document.getElementById('comment-form');
  const urlParts = window.location.pathname.split('/');
  const username = urlParts[1];
  const slug = urlParts[2];

  // Handle reply buttons
  document.querySelectorAll('.comment-reply-button').forEach((button) => {
    button.addEventListener('click', () => {
      const commentId = button.dataset.commentId;
      const replyForm = document.getElementById(`reply-section-${commentId}`);
      if (replyForm) {
        replyForm.classList.toggle('hidden');
        commentForm.dataset.parentId = commentId;
        document.getElementById('comment-editor').focus();
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
