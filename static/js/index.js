var _, $, jQuery;
var ruler = {};

var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var _ = require('ep_etherpad-lite/static/js/underscore');
var rulerClass = 'ruler';

// Bind the event handler to the toolbar buttons
exports.postAceInit = function(hook, context){
  setTimeout(function(){
    ruler.init(context)
  }, 400);
};

ruler.init = function(context){
  var pageWidth = $("#editorcontainer > iframe").outerWidth();
  var pageOffset = $("#editorcontainer > iframe").offset().left || 0;
  var innerWidth = $('iframe[name="ace_outer"]').contents().find('iframe').width();
  var margin = pageWidth - innerWidth;
  var halfMargin = margin/2;

  $('#ep_page_inner').css("width", innerWidth +"px");
  $('#ep_page_ruler_left').css("left", "0px");
  $('#ep_page_ruler_right').css("left", $("#ep_page_ruler_right_container").width() +"px");

  $('#ep_page_ruler_left_container').click(function(e){
    var pageOffset = $("#editorcontainer > iframe").offset().left || 0;
    $('#ep_page_ruler_left').css("left", (e.clientX-pageOffset-114) +"px");
    context.ace.callWithAce(function(ace){
      ace.ace_doInsertRulerLeft(e.clientX-pageOffset-114);
    },'insertRulerLeft' , true);
  });

  $('#ep_page_ruler_right_container').click(function(e){
    var pageOffset = $("#editorcontainer > iframe").offset().left || 0;

    // From the Left
    var left = e.clientX-$("#ep_page_ruler_right_container").offset().left;
    $('#ep_page_ruler_right').css("left", left + "px");

    // From the right..  
    var right = $('#ep_page_ruler_right_container').outerWidth() - left;
    console.log(right);
    context.ace.callWithAce(function(ace){
      ace.ace_doInsertRulerRight( right );
    },'insertRulerRight' , true);
  });

  $('.rulerControl').show();
}

// Our ruler attribute will result in a ruler:x class
function aceAttribsToClasses(hook, context){
  if(context.key == 'rulerLeft'){
    return ['rulerLeft:' + context.value ];
  }
  if(context.key == 'rulerRight'){
    return ['rulerRight:' + context.value ];
  }
}

// Here we convert the class ruler:h1 into a tag
var aceDomLineProcessLineAttributes = function(name, context){

  var cls = context.cls;
  var domline = context.domline;
  var rulerLeft = /(?:^| )rulerLeft:([A-Za-z0-9]*)/.exec(cls);
  var rulerRight = /(?:^| )rulerRight:([A-Za-z0-9]*)/.exec(cls);
  if(rulerLeft || rulerRight){
    var formattedString = "";
    if(rulerLeft){
       formattedString += 'margin-left:' + rulerLeft[1] + 'px;'
    }
    if(rulerRight){ 
      formattedString += 'margin-right:' +rulerRight[1] + 'px;'
    }
  
    var modifier = {
      preHtml: '<div style='+formattedString+'>',
      postHtml: '</div>',
      processedMarker: true
    };
    return [modifier];
  }else{
    return [];
  }
};

// Find out which lines are selected and assign them the ruler attribute.
// Passing a level >= 0 will set a ruler on the selected lines, level < 0 
// will remove it
function doInsertRulerLeft(level){
  var rep = this.rep,
    documentAttributeManager = this.documentAttributeManager;

  var firstLine, lastLine;
  
  firstLine = rep.selStart[0];
  lastLine = Math.max(firstLine, rep.selEnd[0] - ((rep.selEnd[1] === 0) ? 1 : 0));
  _(_.range(firstLine, lastLine + 1)).each(function(i){
    documentAttributeManager.setAttributeOnLine(i, 'rulerLeft', level);
  });
}

// Find out which lines are selected and assign them the ruler attribute.
// Passing a level >= 0 will set a ruler on the selected lines, level < 0
// will remove it
function doInsertRulerRight(level){
  var rep = this.rep,
    documentAttributeManager = this.documentAttributeManager;

  var firstLine, lastLine;
  
  firstLine = rep.selStart[0];
  lastLine = Math.max(firstLine, rep.selEnd[0] - ((rep.selEnd[1] === 0) ? 1 : 0));
  _(_.range(firstLine, lastLine + 1)).each(function(i){
    documentAttributeManager.setAttributeOnLine(i, 'rulerRight', level);
  });
}


// Once ace is initialized, we set ace_doInsertruler and bind it to the context
exports.aceInitialized = function(hook, context){
  var editorInfo = context.editorInfo;
  editorInfo.ace_doInsertRulerLeft = _(doInsertRulerLeft).bind(context);
  editorInfo.ace_doInsertRulerRight = _(doInsertRulerRight).bind(context);
}

// Export all hooks
exports.aceDomLineProcessLineAttributes = aceDomLineProcessLineAttributes;
exports.aceAttribsToClasses = aceAttribsToClasses;
