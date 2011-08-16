$(function () {
  var editor = new Editor( $('#drag' ) );
});

// make the box draggable

function Editor( el ) {
  
  var self = this;
  this.el = el;
  this.ui = {};
  
  this.ui.panel = $('<div id="panel" />').appendTo( this.el );

  // make the box draggable. What kind of events do we get?

  this.ui.box = $('<div class="box" />')
    .appendTo( this.ui.panel )
    .draggable({ 
      containment: this.ui.panel,
      start: function ( event, ui ) {
        console.log( 'Go!' );
      },
      drag: function ( event, ui ) {
        console.log( 'x: ', ui.helper.offset().left, 'y: ', ui.helper.offset().top );
      },
      stop: function ( event, ui ) {
        console.log( 'X: ', ui.helper.offset().left, 'Y: ', ui.helper.offset().top );
      }
    });

  

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
