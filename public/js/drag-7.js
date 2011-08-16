$(function () {
  var editor = new Editor( $('#drag' ) );
});

// add a palette to drag box prototypes off

function Editor( el ) {
  
  var self = this;
  this.el = el;
  this.ui = {};
  
  this.ui.panel = $('<div id="panel" />').appendTo( this.el );
  this.ui.palette = $('<div id="palette" />').appendTo( this.el );

  // this is a fake palette of different box types. for today we're
  // not worried about really implementing these, but you could add
  // additional css classes to define them

  $('<div class="box" />').appendTo( this.ui.palette );
  $('<div class="box" />').appendTo( this.ui.palette );
  $('<div class="box" />').appendTo( this.ui.palette );

  // now the resizer deals with multiple items on the screen, keeping
  // some of them at fixed size, but uses the css so you can fiddle
  // with the design and not have to recode. The 16 is a bit of a
  // fudge for the gap between them but could be pulled from the css
  // easily enough by getting the elements margin
  this.resize = function () {
    var w = $(window).width();
    var h = $(window).height();
    self.ui.palette.css({ 'width': w-16 });
    var t = self.ui.palette.height() + 16;
    self.ui.panel.css({ 'top': t, 'width': w-16, 'height': h-t-8 });
  };

  $(window).bind('resize', function() {
    if ( self.resize_timer) {
      clearTimeout( self.resize_timer);
    }
    self.resize_timer = setTimeout(self.resize, 100);
  });
  
  self.resize_timer = false;
  setTimeout(self.resize, 10);

};
