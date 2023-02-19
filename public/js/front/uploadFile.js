//esversion: 6
const uploadBtn = document.getElementById('upload-btn');
const matureContentInput = document.getElementById('mature');
const matureFieldSet = document.getElementById('maturity-field');
const moderateInput = document.getElementById('moderate');
const strictInput = document.getElementById('strict');

window.addEventListener('DOMContentLoaded', () => {
  const upload = new UploadModal('#upload');
});

matureContentInput.addEventListener('change', (e) => {
  e.preventDefault();
  if (!e.target.checked) {
    matureFieldSet.classList.add('hidden');
    strictInput.checked = false;
    moderateInput.checked = false;
  } else {
    matureFieldSet.classList.remove('hidden');
    moderateInput.checked = true;
  }
});

moderateInput.addEventListener('change', (e) => {
  e.preventDefault();
  if (!e.target.checked) strictInput.checked = true;
  else strictInput.checked = false;
});

strictInput.addEventListener('change', (e) => {
  e.preventDefault();
  if (!e.target.checked) moderateInput.checked = true;
  else moderateInput.checked = false;
});

class UploadModal {
  filename = '';
  isCopying = false;
  isUploading = false;
  progress = 0;
  progressTimeout = null;
  state = 0;

  constructor(el) {
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
  cancel() {
    this.isUploading = false;
    this.progress = 0;
    this.progressTimeout = null;
    this.state = 0;
    this.stateDisplay();
    this.progressDisplay();
    this.fileReset();
  }
  //Copy's the image to clipboard
  async copy() {
    const copyButton = this.el?.querySelector("[data-action='copy']");

    if (!this.isCopying && copyButton) {
      // disable
      this.isCopying = true;
      copyButton.style.width = `${copyButton.offsetWidth}px`;
      copyButton.disabled = true;
      copyButton.textContent = 'Copied!';
      navigator.clipboard.writeText(this.filename);
      await new Promise((res) => setTimeout(res, 1000));
      // reenable
      this.isCopying = false;
      copyButton.removeAttribute('style');
      copyButton.disabled = false;
      copyButton.textContent = 'Copy Link';
    }
  }
  fail() {
    this.isUploading = false;
    this.progress = 0;
    this.progressTimeout = null;
    this.state = 2;
    this.stateDisplay();
  }
  file() {
    this.el?.querySelector('#media').click();
  }
  fileDisplay(name = '') {
    // update the name
    this.filename = name;

    const fileValue = this.el?.querySelector('[data-file]');

    if (fileValue) fileValue.textContent = `Uploading: ${this.filename}`;

    // show the file
    this.el?.setAttribute('data-ready', this.filename ? 'true' : 'false');
  }
  fileHandle(e) {
    return new Promise(() => {
      const { target } = e;
      if (target?.files.length) {
        let reader = new FileReader();
        reader.onload = (e2) => {
          this.fileDisplay(target.files[0].name);
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
        } else if (Utils.randomInt(0, 2) === 0) {
          this.fail();
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

  dropZoneElement.addEventListener('drop', (e) => {
    e.preventDefault();

    if (e.dataTransfer.files.length) {
      inputElement.files = e.dataTransfer.files;
      document.querySelector('.modal-lip-title').innerHTML =
        inputElement.files[0].name;
      updateThumbnail(dropZoneElement, inputElement.files[0]);
      uploadBtn.click();
      // Array.from(inputElement.files).forEach(function (file, i) {
      //   //Update thumbnail
      //   updateThumbnail(dropZoneElement, file);
      //   //Create modal with a form for each upload
      // });
    }
  });

  dropZoneElement.addEventListener('click', (e) => {
    inputElement.click();
  });

  inputElement.addEventListener('change', (e) => {
    if (inputElement.files.length) {
      document.querySelector('.modal-lip-title').innerHTML =
        inputElement.files[0].name;
      updateThumbnail(dropZoneElement, inputElement.files[0]);
      uploadBtn.click();
    }
  });
});

/**
 * Updates the thumbnail on a drop zone element.
 *
 * @param {HTMLElement} dropZoneElement
 * @param {File} file
 */
function updateThumbnail(dropZoneElement, file) {
  let thumbnailElement = dropZoneElement.querySelector('.drop-zone__thumb');

  // First time - remove the prompt
  dropZoneElement.querySelectorAll('.drop-zone__prompt').forEach((prompt) => {
    prompt.style.display = 'none';
  });

  // First time - there is no thumbnail element, so lets create it
  if (!thumbnailElement) {
    thumbnailElement = document.createElement('div');
    thumbnailElement.classList.add('drop-zone__thumb');
    dropZoneElement.appendChild(thumbnailElement);
  }

  thumbnailElement.dataset.label = file.name;

  // Show thumbnail for image files
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = () => {
      thumbnailElement.style.backgroundImage = `url('${reader.result}')`;
      document.querySelector('.uploading-img').src = `${reader.result}`;
      document.querySelector('.uploaded-img').src = `${reader.result}`;
    };
  } else {
    thumbnailElement.style.backgroundImage = null;
  }
}

function addUploadTab(file, index) {
  const name = file.name;
  const fileType = name.slice(-4);
  let uploadTab = document.querySelector('.modal-lip');
  if (index === 0) {
    document.querySelector('.modal-lip-title').innerHTML = file.name;
    //   fileType + ' #' + (index + 1);
  } else {
    uploadTab.innerHTML +=
      '<button class="btn-lip" type="button"> <h3 class="modal-lip-title"> ' +
      fileType +
      ' #' +
      (index + 1) +
      '</h3></button>';
  }
}
