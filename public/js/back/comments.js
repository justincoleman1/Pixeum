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

// Initialize elements arrays for each form
const formElementsMap = new Map(); // Map to store elements for each form (main, edit, reply)

function initializeForm(formId, initialElements = []) {
  formElementsMap.set(formId, [...initialElements]);
}

function getFormElements(formId) {
  return formElementsMap.get(formId) || [];
}

function setFormElements(formId, elements) {
  formElementsMap.set(formId, elements);
}

// Function to position cursor after an element
function positionCursorAfter(element) {
  const range = document.createRange();
  const selection = window.getSelection();
  range.setStartAfter(element);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  element.focus();
}

// Function to insert a newline after an element
function insertNewlineAfter(element) {
  const br = document.createElement('br');
  element.insertAdjacentElement('afterend', br);
  positionCursorAfter(br);
}

// Function to create trash button
function createTrashButton(container, index, formId) {
  const trashButton = document.createElement('button');
  trashButton.className = 'trash-button';
  trashButton.innerHTML = `<img src="/img/svg/trash.svg" class="cbsz" alt="Trash icon">`;
  trashButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    container.remove();
    const elements = getFormElements(formId);
    setFormElements(
      formId,
      elements.filter((_, i) => i !== index)
    );
    const editor = document.getElementById(
      formId === 'comment-form' ? 'comment-editor' : formId
    );
    editor.focus();
  });
  return trashButton;
}

// Function to hide all trash buttons
function hideAllTrashButtons() {
  const trashButtons = document.querySelectorAll('.trash-button');
  trashButtons.forEach((button) => {
    button.classList.remove('active');
  });
}

// Function to handle media upload for any form
function handleMediaUpload(files, formId, editorElement) {
  const mediaPreviewContainer =
    editorElement.parentElement.querySelector('.media-preview-container') ||
    document.createElement('div');
  if (!mediaPreviewContainer.classList.contains('media-preview-container')) {
    mediaPreviewContainer.classList.add('media-preview-container');
    editorElement.parentElement.insertBefore(
      mediaPreviewContainer,
      editorElement.nextSibling
    );
  }

  for (const file of files) {
    const container = document.createElement('div');
    container.className = 'media-container';
    container.contentEditable = 'false';

    const mediaIndex = getFormElements(formId).length;
    const trashButton = createTrashButton(container, mediaIndex, formId);
    container.appendChild(trashButton);

    container.addEventListener('click', (e) => {
      e.stopPropagation();
      hideAllTrashButtons();
      trashButton.classList.add('active');
      const nextSibling = container.nextSibling;
      if (nextSibling && nextSibling.tagName === 'BR') {
        positionCursorAfter(nextSibling);
      } else {
        insertNewlineAfter(container);
      }
    });

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
        editorElement.appendChild(container);
        const elements = getFormElements(formId);
        elements.push({ type: 'excel', value: file.name, file });
        setFormElements(formId, elements);
        insertNewlineAfter(container);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('image/') || file.type === 'image/gif') {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.alt = file.name;
      img.dataset.fileName = file.name;
      img.classList.add('media-preview');
      container.appendChild(img);
      editorElement.appendChild(container);
      const elements = getFormElements(formId);
      elements.push({
        type: file.type.includes('gif') ? 'gif' : 'image',
        value: file.name,
        file,
      });
      setFormElements(formId, elements);
      insertNewlineAfter(container);
    } else {
      alert('Please upload only images, GIFs, or Excel (.xlsx) files.');
    }
  }
}

// Function to capture text before the cursor
function captureTextBeforeCursor(editor) {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return '';

  const range = selection.getRangeAt(0);
  const startContainer = range.startContainer;
  const startOffset = range.startOffset;

  let text = '';
  if (startContainer.nodeType === Node.TEXT_NODE) {
    text = startContainer.textContent.substring(0, startOffset);
  } else if (startContainer === editor) {
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

// Initialize main comment form
const mainForm = document.getElementById('comment-form');
const mainEditor = document.getElementById('comment-editor');
if (mainForm && mainEditor) {
  initializeForm('comment-form');

  // Media upload for main form
  const mainUploadButton = document.getElementById('comment-image');
  const mainFileInput = document.getElementById('media-upload');
  mainUploadButton.addEventListener('click', () => mainFileInput.click());
  mainFileInput.addEventListener('change', () =>
    handleMediaUpload(mainFileInput.files, 'comment-form', mainEditor)
  );

  // Formatting buttons for main form
  const formattingButtons = mainForm.querySelectorAll(
    '.comment-bold-button, .comment-italics-button, .comment-strikethrough-button, .comment-link-button, .comment-spoiler-button, .comment-code-button, .comment-quotes-button, .comment-mention-button'
  );
  formattingButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.id.split('-')[1];
      const editor = document.getElementById('comment-editor');
      const selection = window.getSelection();
      if (selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      let newText = '';

      switch (action) {
        case 'bold':
          newText = `**${selectedText}**`;
          break;
        case 'italics':
          newText = `*${selectedText}*`;
          break;
        case 'strikethrough':
          newText = `~~${selectedText}~~`;
          break;
        case 'link':
          newText = `[${selectedText}](url)`;
          break;
        case 'spoiler':
          newText = `||${selectedText}||`;
          break;
        case 'code':
          newText = `\`${selectedText}\``;
          break;
        case 'quotes':
          newText = `> ${selectedText}`;
          break;
        case 'mention':
          newText = `@${selectedText}`;
          break;
      }

      const textNode = document.createTextNode(newText);
      range.deleteContents();
      range.insertNode(textNode);

      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
      editor.focus();
    });
  });

  // Handle keydown for main form
  mainEditor.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const textBefore = captureTextBeforeCursor(mainEditor);
      if (textBefore.trim()) {
        const elements = getFormElements('comment-form');
        elements.push({ type: 'text', value: textBefore.trim() });
        setFormElements('comment-form', elements);
      }
    }
  });

  // Handle submission for main form
  mainForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitForm('comment-form', mainEditor, null);
  });
}

// Handle edit and reply forms
document.addEventListener('DOMContentLoaded', () => {
  // Initialize edit forms
  const editForms = document.querySelectorAll('.edit-comment-form');
  editForms.forEach((form) => {
    const commentId = form.dataset.commentId;
    const editor = document.getElementById(`edit-comment-editor-${commentId}`);
    const initialElements = []; // Populate from existing comment elements

    // Populate initial elements from comment
    const commentContent = form
      .closest('.comment')
      .querySelector('.comment-content');
    commentContent.querySelectorAll('.comment-element').forEach((element) => {
      if (element.querySelector('p')) {
        initialElements.push({
          type: 'text',
          value: element.querySelector('p').textContent,
        });
      } else if (element.querySelector('.comment-media')) {
        const img = element.querySelector('.comment-media');
        initialElements.push({ type: img.dataset.type, value: img.src });
      } else if (element.querySelector('pre')) {
        initialElements.push({
          type: 'excel',
          value: element.querySelector('pre').textContent,
        });
      }
    });
    initializeForm(`edit-form-${commentId}`, initialElements);

    // Media upload for edit form
    const uploadButton = form.querySelector(`#edit-comment-image-${commentId}`);
    const fileInput = form.querySelector(`#edit-media-upload-${commentId}`);
    uploadButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () =>
      handleMediaUpload(fileInput.files, `edit-form-${commentId}`, editor)
    );

    // Formatting buttons for edit form
    const formattingButtons = form.querySelectorAll(
      '.comment-bold-button, .comment-italics-button, .comment-strikethrough-button, .comment-link-button, .comment-spoiler-button, .comment-code-button, .comment-quotes-button, .comment-mention-button'
    );
    formattingButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.id.split('-')[1];
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const selectedText = range.toString();
        let newText = '';

        switch (action) {
          case 'bold':
            newText = `**${selectedText}**`;
            break;
          case 'italics':
            newText = `*${selectedText}*`;
            break;
          case 'strikethrough':
            newText = `~~${selectedText}~~`;
            break;
          case 'link':
            newText = `[${selectedText}](url)`;
            break;
          case 'spoiler':
            newText = `||${selectedText}||`;
            break;
          case 'code':
            newText = `\`${selectedText}\``;
            break;
          case 'quotes':
            newText = `> ${selectedText}`;
            break;
          case 'mention':
            newText = `@${selectedText}`;
            break;
        }

        const textNode = document.createTextNode(newText);
        range.deleteContents();
        range.insertNode(textNode);

        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
        editor.focus();
      });
    });

    // Handle keydown for edit form
    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const textBefore = captureTextBeforeCursor(editor);
        if (textBefore.trim()) {
          const elements = getFormElements(`edit-form-${commentId}`);
          elements.push({ type: 'text', value: textBefore.trim() });
          setFormElements(`edit-form-${commentId}`, elements);
        }
      }
    });

    // Handle submission for edit form
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await submitForm(`edit-form-${commentId}`, editor, commentId, 'PATCH');
    });
  });

  // Initialize reply forms
  const replyForms = document.querySelectorAll('.reply-form');
  replyForms.forEach((form) => {
    const commentId = form.dataset.commentId;
    const editor = document.getElementById(`reply-comment-editor-${commentId}`);
    initializeForm(`reply-form-${commentId}`);

    // Media upload for reply form
    const uploadButton = form.querySelector(
      `#reply-comment-image-${commentId}`
    );
    const fileInput = form.querySelector(`#reply-media-upload-${commentId}`);
    uploadButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () =>
      handleMediaUpload(fileInput.files, `reply-form-${commentId}`, editor)
    );

    // Formatting buttons for reply form
    const formattingButtons = form.querySelectorAll(
      '.comment-bold-button, .comment-italics-button, .comment-strikethrough-button, .comment-link-button, .comment-spoiler-button, .comment-code-button, .comment-quotes-button, .comment-mention-button'
    );
    formattingButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.id.split('-')[1];
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const selectedText = range.toString();
        let newText = '';

        switch (action) {
          case 'bold':
            newText = `**${selectedText}**`;
            break;
          case 'italics':
            newText = `*${selectedText}*`;
            break;
          case 'strikethrough':
            newText = `~~${selectedText}~~`;
            break;
          case 'link':
            newText = `[${selectedText}](url)`;
            break;
          case 'spoiler':
            newText = `||${selectedText}||`;
            break;
          case 'code':
            newText = `\`${selectedText}\``;
            break;
          case 'quotes':
            newText = `> ${selectedText}`;
            break;
          case 'mention':
            newText = `@${selectedText}`;
            break;
        }

        const textNode = document.createTextNode(newText);
        range.deleteContents();
        range.insertNode(textNode);

        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
        editor.focus();
      });
    });

    // Handle keydown for reply form
    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const textBefore = captureTextBeforeCursor(editor);
        if (textBefore.trim()) {
          const elements = getFormElements(`reply-form-${commentId}`);
          elements.push({ type: 'text', value: textBefore.trim() });
          setFormElements(`reply-form-${commentId}`, elements);
        }
      }
    });

    // Handle submission for reply form
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await submitForm(`reply-form-${commentId}`, editor, commentId);
    });
  });

  // Handle reply button clicks
  document.querySelectorAll('.comment-reply-button').forEach((button) => {
    button.addEventListener('click', () => {
      const commentId = button.dataset.commentId;
      const replySection = document.getElementById(
        `reply-section-${commentId}`
      );
      replySection.classList.toggle('hidden');
      const editor = document.getElementById(
        `reply-comment-editor-${commentId}`
      );
      editor.focus();
      formElementsMap.get('comment-form').dataset.parentId = commentId;
    });
  });

  // Handle edit button clicks
  document.querySelectorAll('.comment-edit-button').forEach((button) => {
    button.addEventListener('click', () => {
      const commentId = button.dataset.commentId;
      const editSection = document.getElementById(`edit-section-${commentId}`);
      editSection.classList.toggle('hidden');
      const editor = document.getElementById(
        `edit-comment-editor-${commentId}`
      );
      editor.focus();
    });
  });

  // Handle delete button clicks
  document.querySelectorAll('.comment-delete-button').forEach((button) => {
    button.addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete this comment?')) {
        const commentId = button.dataset.commentId;
        const urlParts = window.location.pathname.split('/');
        const username = urlParts[1];
        const slug = urlParts[2];

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
      }
    });
  });

  // Handle like and dislike buttons (unchanged)
  const likeButtons = document.querySelectorAll('.comment-like-button');
  likeButtons.forEach((button) => {
    button.addEventListener('click', async (e) => {
      const commentId = e.target.closest('button').dataset.commentId;
      const uploadPath = window.location.pathname;
      try {
        const res = await fetch(
          `/api/v1${uploadPath}/comments/${commentId}/upvote`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
          `/api/v1${uploadPath}/comments/${commentId}/downvote`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        }
      } catch (err) {
        console.error('Error:', err);
      }
    });
  });
});

// Function to handle form submission (shared for main, edit, reply forms)
async function submitForm(formId, editor, commentId = null, method = 'POST') {
  // Capture any remaining text before submission
  const textBefore = captureTextBeforeCursor(editor);
  if (textBefore.trim()) {
    const elements = getFormElements(formId);
    elements.push({ type: 'text', value: textBefore.trim() });
    setFormElements(formId, elements);
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
        const elements = getFormElements(formId);
        elements.push({ type: 'text', value: currentText.trim() });
        setFormElements(formId, elements);
        currentText = '';
      }
    } else if (node.classList && node.classList.contains('media-container')) {
      if (currentText.trim()) {
        const elements = getFormElements(formId);
        elements.push({ type: 'text', value: currentText.trim() });
        setFormElements(formId, elements);
        currentText = '';
      }
    }
  }
  if (currentText.trim()) {
    const elements = getFormElements(formId);
    elements.push({ type: 'text', value: currentText.trim() });
    setFormElements(formId, elements);
  }

  // Prepare FormData for Axios request
  const elements = getFormElements(formId);
  const formData = new FormData();
  formData.append('elements', JSON.stringify(elements));
  elements.forEach((element, index) => {
    if (
      element.type === 'image' ||
      element.type === 'gif' ||
      element.type === 'excel'
    ) {
      if (element.file) {
        formData.append(`media-${index}`, element.file);
      }
    }
  });

  // Get username and slug from URL
  const urlParts = window.location.pathname.split('/');
  const username = urlParts[1];
  const slug = urlParts[2];
  let url = `/api/v1/uploads/${username}/${slug}/comments`;
  if (method === 'PATCH') {
    url += `/${commentId}`;
  } else if (commentId) {
    formData.append('parentComment', commentId);
  }

  try {
    const res = await axios({
      method: method,
      url: url,
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (res.data.status === 'success' || res.status === 204) {
      showAlert(
        'success',
        method === 'PATCH'
          ? 'Comment Updated!'
          : commentId
          ? 'Reply Posted!'
          : 'Comment Posted!'
      );
      window.setTimeout(() => {
        location.reload();
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }

  // Reset editor
  editor.innerHTML = '';
  setFormElements(formId, []);
  if (formId === 'comment-form') {
    formElementsMap.get(formId).dataset.parentId = '';
  }
}

// Handle click on comment media to open modal
document.addEventListener('click', (e) => {
  const media = e.target.closest('.comment-media');
  if (media) {
    const modal = document.getElementById('comment-media-modal');
    const modalImage = document.getElementById('comment-media-modal-image');
    const overlay = document.getElementById('comment-media-modal-overlay');

    modalImage.src = media.src;
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
  }

  const closeButton = e.target.closest('#comment-media-modal-close-btn');
  const overlay = e.target.closest('#comment-media-modal-overlay');
  if (closeButton || overlay) {
    const modal = document.getElementById('comment-media-modal');
    const modalImage = document.getElementById('comment-media-modal-image');
    const overlay = document.getElementById('comment-media-modal-overlay');

    modal.classList.add('hidden');
    overlay.classList.add('hidden');
    modalImage.src = '';
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
