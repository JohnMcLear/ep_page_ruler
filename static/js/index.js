var _, $, jQuery;
var ruler = {};

var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var _ = require('ep_etherpad-lite/static/js/underscore');
var rulerClass = 'ruler';

exports.collectContentLineText = function(hook, context){
  console.log("um", context);
}

// Bind the event handler to the toolbar buttons
exports.postAceInit = function(hook, context){
  setTimeout(function(){
    ruler.init(context);
  }, 400);

  $('#options-pageruler').attr("checked","checked");

  $('#options-pageruler').click(function(){
    if($('#options-pageruler').is(':checked')) {
      $('#ep_page_ruler').show();
    } else {
      $('#ep_page_ruler').hide();
    }
  });
  
  $('#ep_page_inner').mousemove(function(e){
    $('#ep_page_ruler_vertical_line').show().css("left", e.clientX+"px");
  }).mouseout(function(){
    $('#ep_page_ruler_vertical_line').hide();
  });;
};

exports.aceEditEvent = function(hook, call, info, rep, attr){

  // If it's not a click or a key event and the text hasn't changed then do nothing
  if(!(call.callstack.type == "handleClick") && !(call.callstack.type == "handleKeyEvent") && !(call.callstack.docTextChanged)){
    return false;
  }

  // If it's our own event
  if(call.callstack.type == "insertRulerLeft" || call.callstack.type == "insertRulerRight"){
    return false;
  }

  setTimeout(function(){ // avoid race condition..
    var startLine = call.rep.selStart[0]; // Get the line number

    // Does this line number have a left margin?
    startLine = startLine+1; // Lines in JS start at 1 for some bizarre reason
    var div = $('iframe[name="ace_outer"]').contents().find('iframe[name="ace_inner"]').contents().find('div:nth-child('+startLine+')').find('div');
    var marginLeft = $(div).css("margin-left");
    var marginRight = $(div).css("margin-right");

    if ( marginLeft ) {
      marginLeft = parseInt(marginLeft.replace("px",""))+99; // 100 to accomodate for margin
      $('#ep_page_ruler_left_container > .rulerControl').css("left", marginLeft +"px");
    }else{
      $('#ep_page_ruler_left_container > .rulerControl').css("left", "100px");
    }
    if ( marginRight ){
      marginRight = parseInt(marginRight.replace("px",""));
      marginRight = 325-marginRight; // 325 is half of page minus margins
      $('#ep_page_ruler_right_container > .rulerControl').css("left", marginRight +"px");
    }else{
      $('#ep_page_ruler_right_container > .rulerControl').css("left", "325px");
    }
  },250);
}

ruler.init = function(context){
  // we need page_view enabled to use this functionality..
  $('#editorcontainer, iframe').addClass('page_view');

  // lets get the values we need
  var pageWidth = $("#editorcontainer > iframe").outerWidth();
  var pageOffset = $("#editorcontainer > iframe").offset().left || 0;
  var innerWidth = $('iframe[name="ace_outer"]').contents().find('iframe').width();
  var margin = pageWidth - innerWidth;
  var halfMargin = margin/2;

  // format the ruler
  $('#ep_page_inner').css("width", innerWidth +"px");
  $('#ep_page_ruler_right').css("left", $("#ep_page_ruler_right_container").width()-100 +"px");

  // click event for left side
  $('#ep_page_ruler_left_container').click(function(e){
    var pageOffset = $('iframe[name="ace_outer"]').contents().find('iframe[name="ace_inner"]').offset().left;
    $('#ep_page_ruler_left').css("left", (e.clientX-pageOffset)-3 +"px");
    context.ace.callWithAce(function(ace){
      var newLeft = e.clientX-pageOffset-102;
      ace.ace_doInsertRulerLeft(newLeft);
    },'insertRulerLeft' , true);
  });

  // click event for right side
  $('#ep_page_ruler_right_container').click(function(e){
    var pageOffset = $('iframe[name="ace_outer"]').contents().find('iframe[name="ace_inner"]').offset().left;

    // From the Left
    var left = e.clientX-$("#ep_page_ruler_right_container").offset().left;
    left = left+4;
    $('#ep_page_ruler_right').css("left", left + "px");

    // From the right..  
    var right = $('#ep_page_ruler_right_container').outerWidth() - left - 100;
    context.ace.callWithAce(function(ace){
      ace.ace_doInsertRulerRight( right );
    },'insertRulerRight' , true);
  });
  
  // Show the ruler
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
  var rulerLeft = /(?:^| )rulerLeft:([A-Za-z0-9-_]*[A-Za-z0-9])/.exec(cls);
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

