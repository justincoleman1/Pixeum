//esversion: 6
// get references to HTML elements
const editUploadBtn = document.getElementById('edit-upload');

const selectImageDisplaySize = document.getElementById('image-display');
// get the first option element of the "image-display" select element
const firstOption = selectImageDisplaySize.options[0];

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
  action(e) {
    this[e.target?.getAttribute('data-action')]?.();
    this.stateDisplay();
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
    document.querySelector('.modal-lip-title').innerHTML = 'New upload';
  }
  // method to initiate file selection
  file() {
    this.el?.querySelector('#media').click();
  }
  // method to display the selected file
  fileDisplay(name = '') {
    // update the filename instance variable
    this.filename = name;

    const fileValue = this.el?.querySelector('[data-file]');

    if (fileValue) fileValue.textContent = `Uploading: ${this.filename}`;

    // show the file
    this.el?.setAttribute('data-ready', this.filename ? 'true' : 'false');
  }

  // method to handle file selection
  fileHandle(e) {
    return new Promise(() => {
      const { target } = e;
      if (target?.files.length) {
        let reader = new FileReader();
        reader.onload = (e2) => {
          this.fileDisplay(target.files[0].name);
          this.upload();
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
            this.success();
            this.stateDisplay();
            this.progressTimeout = null;
          }
        }, 250);
      }
    }
  }
  stateDisplay() {
    this.el?.setAttribute('data-state', `${this.state}`);
  }
  success() {
    this.isUploading = false;
    this.state = 3;
    this.stateDisplay();
  }
  upload() {
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
  const upload = new UploadModal('#upload');
});

//Set up to possibly to upload multiple files
document.querySelectorAll('.drop-zone__input').forEach((inputElement) => {
  const dropZoneElement = inputElement.closest('.drop-zone');

  dropZoneElement.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZoneElement.classList.add('drop-zone--over');
  });

  ['dragleave', 'dragend'].forEach((type) => {
    dropZoneElement.addEventListener(type, (e) => {
      dropZoneElement.classList.remove('drop-zone--over');
    });
  });

  //click area to select files
  dropZoneElement.addEventListener('click', (e) => {
    inputElement.click();
  });

  //drop file into area
  dropZoneElement.addEventListener('drop', (e) => {
    e.preventDefault();

    if (e.dataTransfer.files.length) {
      inputElement.files = e.dataTransfer.files;
      document.querySelector('.modal-lip-title').innerHTML =
        inputElement.files[0].name;
      updateThumbnail(inputElement.files[0]);
      const fileValue = document.querySelector('[data-file]');
      if (fileValue)
        fileValue.textContent = `Uploading: ${inputElement.files[0].name}`;
    }
  });

  inputElement.addEventListener('change', (e) => {
    if (inputElement.files.length) {
      document.querySelector('.modal-lip-title').innerHTML =
        inputElement.files[0].name;
      updateThumbnail(inputElement.files[0]);
    }
  });

  editUploadBtn.addEventListener('click', (e) => {
    e.preventDefault();
  });
});
