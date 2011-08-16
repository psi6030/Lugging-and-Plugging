$(function () {
  var editor = new Editor( $('#drag' ) );
});

function Editor( el ) {
  
  var self = this;
  this.el = el;
  this.ui = {};
  
  // create the panel we're going to work in 
  this.ui.panel = $('<div id="panel" />').appendTo( this.el );
  
  // handler for window resize
  this.resize = function () {
    var w = $(window).width();
    var h = $(window).height();
    self.ui.panel.css({ 'width': w-16, 'height': h-16 });
  };

  $(window).bind('resize', function() {
    // don't immediately deal with every resize event -- give the user
    // a chance to finish moving
    if ( self.resize_timer ) {
      clearTimeout( self.resize_timer);
    }
    self.resize_timer = setTimeout(self.resize, 100);
  });
  
  self.resize_timer = false;

  // set size on startup. pause a little first to give the browser time
  // to get it together
  setTimeout(self.resize, 10);

};
