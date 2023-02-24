exports.formatBytes = (bytes) => {
  const kb = 1024;
  const mb = kb * 1024;
  const gb = mb * 1024;

  if (bytes < kb) {
    return bytes + ' bytes';
  } else if (bytes < mb) {
    return (bytes / kb).toFixed(2) + ' KB';
  } else if (bytes < gb) {
    return (bytes / mb).toFixed(2) + ' MB';
  } else {
    return (bytes / gb).toFixed(2) + ' GB';
  }
};
