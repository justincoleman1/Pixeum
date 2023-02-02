const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const User = require('../../models/userModel');
const Upload = require('../../models/uploadModel');
const Comment = require('../../models/commentModel');

const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
);

mongoose
  // .connect(process.env.DATABASE_LOCAL, {
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connection successful!'));

//READ JSON FILE
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const uploads = JSON.parse(
  fs.readFileSync(`${__dirname}/uploads.json`, 'utf-8')
);
const comments = JSON.parse(
  fs.readFileSync(`${__dirname}/comments.json`, 'utf-8')
);
//IMPORT DATA INTO DB
const importData = async () => {
  try {
    await User.create(users, { validateBeforeSave: false });
    await Upload.create(uploads);
    await Comment.create(comments);
    // console.log('upload Data imported successfully!');
  } catch (err) {
    console.error(err);
  }
  process.exit();
};

//DELETE ALL DATA FROM COLLECTION
const deleteData = async () => {
  try {
    await Comment.deleteMany();
    await Upload.deleteMany();
    await User.deleteMany();
    // console.log('Data deleted successfully!');
  } catch (err) {
    console.error(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
// console.log(process.argv);
