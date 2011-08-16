$(function() {
  var editor = new Editor( $('#drag' ) );
});

// now we know the basics are going to work how we want, it's time to
// clean the code up. Don't store real data in the DOM. You should be
// able to create boxes with code.

// start down the bottom to check out the prootypes

function Editor( el ) {
  
  var self = this;
  this.el = el;
  this.ui = {};

  this.init = function() {

    self.ui.panel = $('<div id="panel" />').appendTo( self.el );
    self.ui.palette = $('<div id="palette" />').appendTo( self.el );

    self.boxes = new Boxes({panel: self.ui.panel});

    $(window).bind('resize', function() {
      if ( self.resize_timer) {
        clearTimeout( self.resize_timer);
      }
      self.resize_timer = setTimeout(self.resize, 100);
    });
    
    self.resize_timer = false;
    setTimeout(self.resize, 10);
    
    for ( var i = 3; i--; i > 0 ) {
      $('<div class="box new" />').appendTo( self.ui.palette );
    }

    $("#palette .box").draggable({ 
      stack: '.box',
      revert: 'invalid',
      revertDuration: 250,
      appendTo: self.ui.panel,
      opacity: 0.5,
      start: function ( event, ui ) {
        self.disableMove = true;
      },
      helper: 'clone'
    });

    self.ui.panel.droppable({ 
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
          // create the new box
          self.boxes.add({x:x, y:y});
        }
      }
    });

  };

  this.resize = function () {
    var w = $(window).width();
    var h = $(window).height();
    self.ui.palette.css({ 'width': w-16 });
    var t = self.ui.palette.height() + 16;
    self.ui.panel.css({ 'top': t, 'width': w-16, 'height': h-t-8 });
  };

  self.init();

};

// maintains the collection of boxes
var Boxes = function ( opts ) {
  var self = this;
  this.boxes = [];
  this.panel = opts.panel;

  this.add = function (opts) {
    opts.boxes = self;
    opts.panel = self.panel;
    self.boxes.push( new Box(opts) );
  };

  this.del = function (cid) {
    for ( var i = 0, ii = self.boxes.length; i < ii; i++ ) {
      if ( self.boxes[i].cid == cid ) {
        self.boxes.splice(i, 1);
        break;
      }
    }
  };
}

// one of the actual boxes we drag around
var Box = function (opts) {
  var self = this;
  this.opts = opts || {};
  this.opts.x = this.opts.x || 8;
  this.opts.y = this.opts.y || 8;
  this.cid = _.uniqueId('box');

  this.snap = function (n) {
    return Math.floor ( n / 8 ) * 8;
  }

  this.el = $('<div class="box" />')
    .attr('id',self.cid)
    .appendTo( self.opts.panel )
    .css({'left': self.snap(opts.x), 'top':self.snap(opts.y)})
    .draggable({ 
      containment: self.opts.panel,
      stack: '.box',
      stop: function ( event, ui ) {
        var x = ui.helper.offset().left - self.opts.panel.offset().left;
        var y = ui.helper.offset().top - self.opts.panel.offset().top;
        $(this).css({'left':self.snap(x), 'top': self.snap(y)});
      }
    });

  $('<a class="delete">&times;</a>')
    .appendTo(this.el)
    .bind('click', function (e) {
      e.preventDefault();
      $(e.target).parents('div:first').fadeOut(250, function() {
        self.opts.boxes.del(self.cid);
        $(self.el).remove();
      });
    });

}
