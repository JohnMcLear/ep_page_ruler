const eejs = require('ep_etherpad-lite/node/eejs/');
const Changeset = require('ep_etherpad-lite/static/js/Changeset');

exports.eejsBlock_dd_view = function (hook_name, args, cb) {
  args.content += eejs.require('ep_page_ruler/templates/fileMenu.ejs');
  return cb();
};

exports.eejsBlock_mySettings = function (hook_name, args, cb) {
  args.content += eejs.require('ep_page_ruler/templates/page_ruler_entry.ejs');
  return cb();
};

exports.eejsBlock_afterEditbar = function (hook_name, args, cb) {
  args.content += eejs.require('ep_page_ruler/templates/toolbar.ejs', {settings: false});
};

function getInlineStyle(header) {
  switch (header) {
    case 'h1':
      return 'font-size: 2.0em;line-height: 120%;';
      break;
    case 'h2':
      return 'font-size: 1.5em;line-height: 120%;';
      break;
    case 'h3':
      return 'font-size: 1.17em;line-height: 120%;';
      break;
    case 'h4':
      return 'line-height: 120%;';
      break;
    case 'h5':
      return 'font-size: 0.83em;line-height: 120%;';
      break;
    case 'h6':
      return 'font-size: 0.75em;line-height: 120%;';
      break;
    case 'code':
      return 'font-family: monospace';
  }

  return '';
}
// line, apool,attribLine,text
exports.getLineHTMLForExport = function (hook, context) {
  const header = _analyzeLine(context.attribLine, context.apool);
  if (header) {
    if (context.lineContent[0] === '*') {
      context.lineContent = context.lineContent.substring(1);
    }
    const inlineStyle = getInlineStyle(header);
    context.lineContent = `<${header} style="${inlineStyle}">${context.lineContent}</${header}>`;
  }
  return true;
};

function _analyzeLine(alineAttrs, apool) {
  let header = null;
  if (alineAttrs) {
    const opIter = Changeset.opIterator(alineAttrs);
    if (opIter.hasNext()) {
      const op = opIter.next();
      header = Changeset.opAttributeValue(op, 'heading', apool);
    }
  }
  return header;
}
