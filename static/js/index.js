var _, $, jQuery;

var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var _ = require('ep_etherpad-lite/static/js/underscore');
var headingClass = 'heading';
var cssFiles = ['ep_headings/static/css/editor.css'];

// All our tags are block elements, so we just return them.
var tags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code'];
var aceRegisterBlockElements = function(){
  return tags;
}

// Bind the event handler to the toolbar buttons
var postAceInit = function(hook, context){
  /*
  var hs = $('#heading-selection');
  hs.on('change', function(){
    var value = $(this).val();
    var intValue = parseInt(value,10);
    if(!_.isNaN(intValue)){
      context.ace.callWithAce(function(ace){
        ace.ace_doInsertHeading(intValue);
      },'insertheading' , true);
      hs.val("dummy");
    }
  })
  */
  var pageWidth = $("#editorcontainer > iframe").outerWidth();
  var pageOffset = $("#editorcontainer > iframe").offset().left;
  var innerWidth = $('iframe[name="ace_outer"]').contents().find('iframe').width();
  var margin = pageWidth - innerWidth;
  var halfMargin = margin/2;
  $('#ep_page_inner').css("width", pageWidth +"px");
  $('#ep_page_ruler_left').css("left", (halfMargin-4) +"px");
  $('#ep_page_ruler_right').css("right", (halfMargin+4) +"px");

  $('#ep_page_ruler_left_container').click(function(e){
    $('#ep_page_ruler_left').css("left", (e.screenX-pageOffset) +"px");
  });
  $('#ep_page_ruler_right_container').click(function(e){
    $('#ep_page_ruler_right').css("left", (e.screenX-pageOffset) +"px");
  });

};
/*
function moveRuler(target, e){
  var pageOffset = $("#editorcontainer > iframe").offset().left;
  $(target).css("left", (e.screenX-pageOffset) +"px");
  console.log(target, e);
}
*/
// Our heading attribute will result in a heaading:h1... :h6 class
function aceAttribsToClasses(hook, context){
  if(context.key == 'heading'){
    return ['heading:' + context.value ];
  }
}

// Here we convert the class heading:h1 into a tag
var aceDomLineProcessLineAttributes = function(name, context){
  var cls = context.cls;
  var domline = context.domline;
  var headingType = /(?:^| )heading:([A-Za-z0-9]*)/.exec(cls);
  var tagIndex;
  
  if (headingType) tagIndex = _.indexOf(tags, headingType[1]);
  
  if (tagIndex !== undefined && tagIndex >= 0){
    
    var tag = tags[tagIndex];
    var modifier = {
      preHtml: '<' + tag + '>',
      postHtml: '</' + tag + '>',
      processedMarker: true
    };
    return [modifier];
  }
  return [];
};

// Find out which lines are selected and assign them the heading attribute.
// Passing a level >= 0 will set a heading on the selected lines, level < 0 
// will remove it
function doInsertHeading(level){
  var rep = this.rep,
    documentAttributeManager = this.documentAttributeManager;
  if (!(rep.selStart && rep.selEnd) || (level >= 0 && tags[level] === undefined))
  {
    return;
  }
  
  var firstLine, lastLine;
  
  firstLine = rep.selStart[0];
  lastLine = Math.max(firstLine, rep.selEnd[0] - ((rep.selEnd[1] === 0) ? 1 : 0));
  _(_.range(firstLine, lastLine + 1)).each(function(i){
    if(level >= 0){
      documentAttributeManager.setAttributeOnLine(i, 'heading', tags[level]);
    }else{
      documentAttributeManager.removeAttributeOnLine(i, 'heading');
    }
  });
}


// Once ace is initialized, we set ace_doInsertHeading and bind it to the context
function aceInitialized(hook, context){
  var editorInfo = context.editorInfo;
  editorInfo.ace_doInsertHeading = _(doInsertHeading).bind(context);
}

function aceEditorCSS(){
  return cssFiles;
};

// Export all hooks
exports.aceRegisterBlockElements = aceRegisterBlockElements;
exports.aceInitialized = aceInitialized;
exports.postAceInit = postAceInit;
exports.aceDomLineProcessLineAttributes = aceDomLineProcessLineAttributes;
exports.aceAttribsToClasses = aceAttribsToClasses;
exports.aceEditorCSS = aceEditorCSS;
