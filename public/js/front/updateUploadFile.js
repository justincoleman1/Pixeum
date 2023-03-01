//esversion: 6
// get references to HTML elements
const editUploadBtn = document.getElementById('edit-upload');

const selectImageDisplaySize = document.getElementById('image-display');
// get the first option element of the "image-display" select element
const firstOption = selectImageDisplaySize.options[0];

let upload;

// a class representing the upload modal
class UploadModal {
  // initialize instance variables
  filename = '';
  isCopying = false;
  isUploading = false;
  progress = 0;
  progressTimeout = null;
  state = 0;

  constructor(el) {
    // set up event listeners for the modal and its file input element
    this.el = document.querySelector(el);
    this.el?.addEventListener('click', this.action.bind(this));
    this.el
      ?.querySelector('#media')
      ?.addEventListener('change', this.fileHandle.bind(this));
  }

  reset() {
    this.filename = '';
    this.isCopying = false;
    this.isUploading = false;
    this.progress = 0;
    this.progressTimeout = null;
    this.state = 0;
    this.stateDisplay();
    this.progressDisplay();
    this.fileReset();
  }

  action(e) {
    this[e.target?.getAttribute('data-action')]?.();
  }
  // method to cancel the upload
  cancel() {
    this.isUploading = false;
    this.progress = 0;
    this.progressTimeout = null;
    this.state = 0;
    this.stateDisplay();
    this.progressDisplay();
    this.fileReset();
  }
  // method to initiate file selection
  file() {
    // reset the state to 0 when a new file is selected
    this.state = 0;
    this.stateDisplay();

    this.el?.querySelector('#media').click();
  }

  showFile() {
    this.el?.setAttribute('data-ready', this.filename ? 'true' : 'false');
    this.state = 0; // reset the state to "finished" (0) when a new file is selected
    this.stateDisplay();
  }
  // method to display the selected file
  fileDisplay(name = '') {
    console.log(name);

    // update the filename instance variable
    this.filename = name;

    const fileValue = this.el?.querySelector('[data-file]');

    if (fileValue) fileValue.textContent = `Uploading: ${this.filename}`;

    // show the file
    this.showFile();
  }

  // method to handle file selection
  fileHandle(e) {
    console.log('file handling...');
    this.state = 0; // reset the state to "finished" (0) when a new file is selected
    this.stateDisplay();
    return new Promise(() => {
      const { target } = e;
      if (target?.files.length) {
        let reader = new FileReader();
        reader.onload = (e2) => {
          this.fileDisplay(target.files[0].name);
          this.upload();
          this.stateDisplay();
        };
        reader.readAsDataURL(target.files[0]);
      }
    });
  }
  fileReset() {
    const fileField = this.el?.querySelector('#media');
    if (fileField) fileField.value = null;

    this.fileDisplay();
  }
  progressDisplay() {
    console.log('progressing...');

    const progressValue = this.el?.querySelector('[data-progress-value]');
    const progressFill = this.el?.querySelector('[data-progress-fill]');
    const progressTimes100 = Math.floor(this.progress * 100);

    if (progressValue) progressValue.textContent = `${progressTimes100}%`;
    if (progressFill)
      progressFill.style.transform = `translateX(${progressTimes100}%)`;
  }
  async progressLoop() {
    this.progressDisplay();

    if (this.isUploading) {
      if (this.progress === 0) {
        await new Promise((res) => setTimeout(res, 1000));
        // fail randomly
        if (!this.isUploading) {
          return;
        }
      }
      // …or continue with progress
      if (this.progress < 1) {
        this.progress += 0.01;
        this.progressTimeout = setTimeout(this.progressLoop.bind(this), 50);
      } else if (this.progress >= 1) {
        this.progressTimeout = setTimeout(() => {
          if (this.isUploading) {
            // when progress is 100%, set state to 0 (finished state)
            this.state = 0;
            this.stateDisplay();
            this.progressTimeout = null;
          }
        }, 250);
      }
    }
  }
  stateDisplay() {
    console.log('state display');

    const uploadingEl = this.el.querySelector('#uploading');
    const finishedEl = this.el.querySelector('#finished');

    switch (this.state) {
      case 0:
        uploadingEl.classList.add('hidden');
        finishedEl.classList.remove('hidden');
        break;
      case 1:
        uploadingEl.classList.remove('hidden');
        finishedEl.classList.add('hidden');
        break;
      default:
        throw new Error(`Invalid state: ${this.state}`);
    }
  }
  upload() {
    console.log('uploading');
    if (!this.isUploading) {
      this.isUploading = true;
      this.progress = 0;
      this.state = 1;
      this.stateDisplay();
      this.progressLoop();
    }
  }
}

class Utils {
  static randomInt(min = 0, max = 2 ** 32) {
    const percent = crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
    const relativeValue = (max - min) * percent;

    return Math.round(min + relativeValue);
  }
}

/**
 * Updates the thumbnail on a drop zone element.
 *
 * @param {HTMLElement} dropZoneElement
 * @param {File} file
 */
function updateThumbnail(file) {
  // Show thumbnail for image files
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = () => {
      document.querySelector('.uploading-img').src = `${reader.result}`;
      document.querySelector('.uploaded-img').src = `${reader.result}`;

      const img = new Image();
      img.onload = function () {
        // alert(this.width + 'x' + this.height);
        firstOption.textContent = `Original (${this.width} x ${this.height} pixels)`;
      };
      img.src = `${reader.result}`;
    };
  }
}

// set up an event listener for the window's load event
window.addEventListener('DOMContentLoaded', () => {
  // create a new UploadModal object with a reference to the modal HTML element
  upload = new UploadModal('.image-processing-step');
});

const inputElement = document.querySelector('.drop-zone__input');
// const dropZoneElement = document.querySelector('.modal__actions.drop-zone');

inputElement.addEventListener('change', (e) => {
  if (inputElement.files.length) {
    document.querySelector('.modal-lip-title').innerHTML =
      inputElement.files[0].name;
    updateThumbnail(inputElement.files[0]);
  }
});

editUploadBtn.addEventListener('click', (e) => {
  upload.reset();
  inputElement.click();
});
