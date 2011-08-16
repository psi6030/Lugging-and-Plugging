$(function () {
  var editor = new Editor( $('#drag' ) );
});

// make the palette boxes droppable on to the panel

function Editor( el ) {
  
  var self = this;
  this.el = el;
  this.ui = {};

  this.ui.panel = $('<div id="panel" />').appendTo( this.el );
  this.ui.palette = $('<div id="palette" />').appendTo( this.el );
  
  // since an already existing box can be dropped on the panel (after
  // being dragged around) there's a .new on these now to we can tell
  // them apart from existing boxes
  $('<div class="box new" />').appendTo( this.ui.palette );
  $('<div class="box new" />').appendTo( this.ui.palette );
  $('<div class="box new" />').appendTo( this.ui.palette );

  // now let us drag the palette items, but create a copy and leave
  // the original there
  $("#palette .box").draggable({ 
    revert: 'invalid',
    revertDuration: 250,
    appendTo: this.ui.panel,
    opacity: 0.5,
    start: function ( event, ui ) {
      self.disableMove = true;
    },
    helper: 'clone'
  });

  // when a box (cloned from the palette) is dropped on the
  // panel. create a real one. The css is set up so a .box look
  // different depending which container it's in

  // the boxes don't have any concept of depth yet. most recent box
  // placed is on the top
  this.ui.panel.droppable({ 
    accept: function(e) {
      if ( $(e).hasClass('box') ) {
        return true;
      }
      return false;
    },
    drop: function(event, ui) {
      // if it has a new class, create a new box
      if ( ui.helper.hasClass('new') ) {
        var x = ui.helper.offset().left - self.ui.panel.offset().left;
        var y = ui.helper.offset().top - self.ui.panel.offset().top;
        var box = $('<div class="box" />')
          .appendTo( self.ui.panel )
          .css({'left':x, 'top':y})
          .draggable({ 
            containment: self.ui.panel,
            stop: function ( event, ui ) {
              console.log( 'X: ', ui.helper.offset().left, 'Y: ', ui.helper.offset().top );
            }
          });
      }
    }
  });

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
