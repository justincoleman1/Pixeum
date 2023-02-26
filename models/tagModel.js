const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      minlength: 2,
      maxlength: 30,
      require: [true, "A tag's name can not be empty!"],
    },
    count: {
      type: Number,
      default: 1,
    },
    view_count: {
      type: Number,
      default: 1,
    },
    maturity: {
      type: String,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tagSchema.set('timestamps', true);

tagSchema.pre(/^find/, function (next) {
  this.sort({ count: -1 });

  next();
});
//get access to the current tag document
tagSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  console.log(this.r);
  next();
});

// tagSchema.post(/^findOneAnd/, async function () {
//   await this.findOne(); does not work here, query is already executed
// });

const Tag = mongoose.model('Tag', tagSchema);
module.exports = Tag;
