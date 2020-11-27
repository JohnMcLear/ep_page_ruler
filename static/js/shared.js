var _ = require('ep_etherpad-lite/static/js/underscore');

var tags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code'];

var collectContentPre = function (hook, context) {
  const tname = context.tname;
  const state = context.state;
  const lineAttributes = state.lineAttributes;
  const tagIndex = _.indexOf(tags, tname);

  if (tagIndex >= 0) {
    lineAttributes.heading = tags[tagIndex];
  }
};

var collectContentPost = function (hook, context) {
  const tname = context.tname;
  const state = context.state;
  const lineAttributes = state.lineAttributes;
  const tagIndex = _.indexOf(tags, tname);

  if (tagIndex >= 0) {
    delete lineAttributes.heading;
  }
};

exports.collectContentPre = collectContentPre;
exports.collectContentPost = collectContentPost;
