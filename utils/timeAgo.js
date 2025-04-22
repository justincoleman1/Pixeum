exports.timeAgo2 = (before) => {
  const now = new Date();
  let secs = Math.round(now.getTime() - before) / 1000;
  secs = Math.round(secs);
  const mins = Math.round(secs / 60);
  const hours = Math.round(mins / 60);
  const days = Math.round(hours / 24);
  const months = Math.round(days / 30);
  const years = Math.round(months / 12);

  if (secs <= 5) {
    return 'just now';
  } else if (secs <= 60) {
    return `${secs} secs ago`;
  } else if (secs <= 90) {
    return 'about a minute ago';
  } else if (mins <= 60) {
    return `${mins} mins ago`;
  } else if (mins <= 90) {
    return `an hour ago`;
  } else if (hours <= 24) {
    return `${hours} hours ago`;
  } else if (hours <= 36) {
    return `1 day ago`;
  } else if (days <= 30) {
    return `${days} days ago`;
  } else if (days <= 45) {
    return `1 month ago`;
  } else if (months <= 12) {
    return `${months} months ago`;
  } else if (months <= 18) {
    return `1 year ago`;
  } else `${years} years ago`;
};
