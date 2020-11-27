var _, $, jQuery;
var ruler = {};

var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var _ = require('ep_etherpad-lite/static/js/underscore');
var rulerClass = 'ruler';

exports.collectContentLineText = function (hook, context) {
  console.log('um', context);
};

// Bind the event handler to the toolbar buttons
exports.postAceInit = function (hook, context) {
  setTimeout(() => {
    ruler.init(context);
  }, 400);

  $('#options-pageruler').attr('checked', 'checked');

  $('#options-pageruler').click(() => {
    if ($('#options-pageruler').is(':checked')) {
      $('#ep_page_ruler').show();
    } else {
      $('#ep_page_ruler').hide();
    }
  });

  $('#ep_page_inner').mousemove((e) => {
    $('#ep_page_ruler_vertical_line').show().css('left', `${e.clientX}px`);
  }).mouseout(() => {
    $('#ep_page_ruler_vertical_line').hide();
  });
};

exports.aceEditEvent = function (hook, call, info, rep, attr) {
  // If it's not a click or a key event and the text hasn't changed then do nothing
  if (!(call.callstack.type == 'handleClick') && !(call.callstack.type == 'handleKeyEvent') && !(call.callstack.docTextChanged)) {
    return false;
  }

  // If it's our own event
  if (call.callstack.type == 'insertRulerLeft' || call.callstack.type == 'insertRulerRight') {
    return false;
  }

  setTimeout(() => { // avoid race condition..
    if (!call || !call.rep || !call.rep.selStart) return;
    let startLine = call.rep.selStart[0]; // Get the line number

    // Does this line number have a left margin?
    startLine += 1; // Lines in JS start at 1 for some bizarre reason
    const div = $('iframe[name="ace_outer"]').contents().find('iframe[name="ace_inner"]').contents().find(`div:nth-child(${startLine})`).find('div');
    let marginLeft = $(div).css('margin-left');
    let marginRight = $(div).css('margin-right');

    if (marginLeft) {
      marginLeft = parseInt(marginLeft.replace('px', '')) + 99; // 100 to accomodate for margin
      $('#ep_page_ruler_left_container > .rulerControl').css('left', `${marginLeft}px`);
    } else {
      $('#ep_page_ruler_left_container > .rulerControl').css('left', '100px');
    }
    if (marginRight) {
      marginRight = parseInt(marginRight.replace('px', ''));
      marginRight = 325 - marginRight; // 325 is half of page minus margins
      $('#ep_page_ruler_right_container > .rulerControl').css('left', `${marginRight}px`);
    } else {
      $('#ep_page_ruler_right_container > .rulerControl').css('left', '325px');
    }
  }, 250);
};

ruler.init = function (context) {
  // we need page_view enabled to use this functionality..
  $('#editorcontainer, iframe').addClass('page_view');

  // lets get the values we need
  const pageWidth = $('#editorcontainer > iframe').outerWidth();
  const pageOffset = $('#editorcontainer > iframe').offset().left || 0;
  const innerWidth = $('iframe[name="ace_outer"]').contents().find('iframe').width();
  const margin = pageWidth - innerWidth;
  const halfMargin = margin / 2;

  // format the ruler
  $('#ep_page_inner').css('width', `${innerWidth}px`);
  $('#ep_page_ruler_right').css('left', `${$('#ep_page_ruler_right_container').width() - 100}px`);

  // click event for left side
  $('#ep_page_ruler_left_container').click((e) => {
    const pageOffset = $('iframe[name="ace_outer"]').contents().find('iframe[name="ace_inner"]').offset().left;
    $('#ep_page_ruler_left').css('left', `${(e.clientX - pageOffset) - 3}px`);
    context.ace.callWithAce((ace) => {
      const newLeft = e.clientX - pageOffset - 102;
      ace.ace_doInsertRulerLeft(newLeft);
    }, 'insertRulerLeft', true);
  });

  // click event for right side
  $('#ep_page_ruler_right_container').click((e) => {
    const pageOffset = $('iframe[name="ace_outer"]').contents().find('iframe[name="ace_inner"]').offset().left;

    // From the Left
    let left = e.clientX - $('#ep_page_ruler_right_container').offset().left;
    left += 4;
    $('#ep_page_ruler_right').css('left', `${left}px`);

    // From the right..
    const right = $('#ep_page_ruler_right_container').outerWidth() - left - 100;
    context.ace.callWithAce((ace) => {
      ace.ace_doInsertRulerRight(right);
    }, 'insertRulerRight', true);
  });

  // Show the ruler
  $('.rulerControl').show();
};

// Our ruler attribute will result in a ruler:x class
function aceAttribsToClasses(hook, context) {
  if (context.key == 'rulerLeft') {
    return [`rulerLeft:${context.value}`];
  }
  if (context.key == 'rulerRight') {
    return [`rulerRight:${context.value}`];
  }
}

// Here we convert the class ruler:h1 into a tag
var aceDomLineProcessLineAttributes = function (name, context) {
  const cls = context.cls;
  const domline = context.domline;
  const rulerLeft = /(?:^| )rulerLeft:([A-Za-z0-9-_]*[A-Za-z0-9])/.exec(cls);
  const rulerRight = /(?:^| )rulerRight:([A-Za-z0-9]*)/.exec(cls);
  if (rulerLeft || rulerRight) {
    let formattedString = '';
    if (rulerLeft) {
      formattedString += `margin-left:${rulerLeft[1]}px;`;
    }
    if (rulerRight) {
      formattedString += `margin-right:${rulerRight[1]}px;`;
    }

    const modifier = {
      preHtml: `<div style=${formattedString}>`,
      postHtml: '</div>',
      processedMarker: true,
    };
    return [modifier];
  } else {
    return [];
  }
};

// Find out which lines are selected and assign them the ruler attribute.
// Passing a level >= 0 will set a ruler on the selected lines, level < 0
// will remove it
function doInsertRulerLeft(level) {
  const rep = this.rep;
  const documentAttributeManager = this.documentAttributeManager;

  let firstLine, lastLine;

  firstLine = rep.selStart[0];
  lastLine = Math.max(firstLine, rep.selEnd[0] - ((rep.selEnd[1] === 0) ? 1 : 0));
  _(_.range(firstLine, lastLine + 1)).each((i) => {
    documentAttributeManager.setAttributeOnLine(i, 'rulerLeft', level);
  });
}

// Find out which lines are selected and assign them the ruler attribute.
// Passing a level >= 0 will set a ruler on the selected lines, level < 0
// will remove it
function doInsertRulerRight(level) {
  const rep = this.rep;
  const documentAttributeManager = this.documentAttributeManager;

  let firstLine, lastLine;

  firstLine = rep.selStart[0];
  lastLine = Math.max(firstLine, rep.selEnd[0] - ((rep.selEnd[1] === 0) ? 1 : 0));
  _(_.range(firstLine, lastLine + 1)).each((i) => {
    documentAttributeManager.setAttributeOnLine(i, 'rulerRight', level);
  });
}


// Once ace is initialized, we set ace_doInsertruler and bind it to the context
exports.aceInitialized = function (hook, context) {
  const editorInfo = context.editorInfo;
  editorInfo.ace_doInsertRulerLeft = _(doInsertRulerLeft).bind(context);
  editorInfo.ace_doInsertRulerRight = _(doInsertRulerRight).bind(context);
};

// Export all hooks
exports.aceDomLineProcessLineAttributes = aceDomLineProcessLineAttributes;
exports.aceAttribsToClasses = aceAttribsToClasses;
