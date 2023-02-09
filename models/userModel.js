const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide us your name!'],
      minlength: 3,
      maxlength: 20,
    },
    username: {
      type: String,
      required: [true, 'Please provide us your username!'],
      unique: true,
      minlength: 4,
      maxlength: 16,
    },
    email: {
      type: String,
      required: [true, 'Please provide us your email!'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email!'],
    },
    gender: {
      type: String,
      lowercase: true,
    },
    photo: {
      type: String,
      default: 'default.jpg',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 8,
      maxlength: 32,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        //This only works on create and save
        validator: function (passConfirm) {
          return passConfirm === this.password;
        },
        message: 'Passwords do not match',
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    subscriber_count: {
      type: Number,
      default: 0,
    },
    follower_count: {
      type: Number,
      default: 0,
    },
    moderators: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.virtual('Comments', {
  ref: 'Comment',
  foreignField: 'user',
  localField: '_id',
});

userSchema.virtual('Uploads', {
  ref: 'Upload',
  foreignField: 'user',
  localField: '_id',
});

//DOCUMENT MIDDLEWARE: runs before .save() and .create()
//Password Incryption
userSchema.pre('save', async function (next) {
  //Only run this function if passowrd was modified
  if (!this.isModified('password')) return next();
  //Has paswword with cost of 12
  this.password = await bcrypt.hash(this.password, 14);
  //Delete password confirm field
  this.passwordConfirm = undefined;

  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// //check if the user changed passwords after given a jwttimestamp
userSchema.methods.changedPasswordAfter = function (jwtTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    //return if the user changed passwords after given a jwttimestamp
    //iffalse user did not change passwords after given their current jwttimestamp
    //iftrue user did change passwords after given jwttimestamp
    return jwtTimeStamp < changedTimeStamp;
  }
  //user has never changed their password
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
