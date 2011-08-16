$(function () {
  var editor = new Editor( $('#drag' ) );
});

// draw a box on the panel

function Editor( el ) {
  
  var self = this;
  this.el = el;
  this.ui = {};
  
  this.ui.panel = $('<div id="panel" />').appendTo( this.el );

  // Added a box to play with. Grab a reference to it at the same time
  // to save finding it in the DOM when we're going to work with it.
  this.ui.box = $('<div class="box" />')
    .appendTo( this.ui.panel );

  this.resize = function () {
    var w = $(window).width();
    var h = $(window).height();
    self.ui.panel.css({ 'width': w-16, 'height': h-16 });
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
