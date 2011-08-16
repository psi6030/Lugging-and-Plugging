$(function() {
  var editor = new Editor( $('#drag' ) );
});

// make the boxes deletable

function Editor( el ) {
  
  var self = this;
  this.el = el;
  this.ui = {};

  this.ui.panel = $('<div id="panel" />').appendTo( this.el );
  this.ui.palette = $('<div id="palette" />').appendTo( this.el );

  $('<div class="box new" />').appendTo( this.ui.palette );
  $('<div class="box new" />').appendTo( this.ui.palette );
  $('<div class="box new" />').appendTo( this.ui.palette );

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


  this.ui.panel.droppable({ 
    accept: function(e) {
      if ( $(e).hasClass('box') ) {
        return true;
      }
      return false;
    },   
    drop: function(event, ui) {
      if ( ui.helper.hasClass('new') ) {
        var x = ui.helper.offset().left - self.ui.panel.offset().left;
        var y = ui.helper.offset().top - self.ui.panel.offset().top;
        var box = $('<div class="box" />')
          .appendTo( self.ui.panel )
          .css({'left':x, 'top':y})
          .draggable({ 
            containment: self.ui.panel,
            // stacking brings the most recently touched box to the
            // top, but doesn't deal with click-to-top
            stack: '.box',
            stop: function ( event, ui ) {
              console.log( 'X: ', ui.helper.offset().left, 'Y: ', ui.helper.offset().top );
            }
          });
        // now we can delete boxes too. css is doing most of the work
        $('<a class="delete">&times;</a>')
          .appendTo(box)
          .bind('click', function (e) {
            e.preventDefault();
            $(e.target).parents('div:first').fadeOut(250, function() {
              $(box).remove();
            });
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
