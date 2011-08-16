$(function() {
  var editor = new Editor( $('#drag' ) );
});

// add a cable to the dragged outlet

function Editor( el ) {
  
  var self = this;
  this.el = el;
  this.ui = {};

  this.init = function() {

    this.ui.canvas = $('<div id="canvas" />').appendTo( this.el );
    this.ui.panel = $('<div id="panel" />').appendTo( this.el );
    this.ui.palette = $('<div id="palette" />').appendTo( this.el );

    this.ui.paper = false;
    this.boxes = new Boxes({panel: this.ui.panel, paper: this.ui.paper});

    $(window).bind('resize', function() {
      if ( self.resize_timer) {
        clearTimeout( self.resize_timer);
      }
      self.resize_timer = setTimeout(self.resize, 100);
    });
    
    self.resize_timer = false;
    setTimeout(self.resize, 10);
    
    for ( var i = 3; i--; i > 0 ) {
      $('<div class="box new" />').appendTo( this.ui.palette );
    }

    $("#palette .box").draggable({ 
      stack: '.box',
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
    self.ui.canvas.css({ 'top': t, 'width': w-16, 'height': h-t-8 });
    self.ui.panel.css({ 'top': t, 'width': w-16, 'height': h-t-8 });
    self.render();
  };

  this.render = function () {
    var rz = 16;
    var w = self.ui.canvas.width();
    var h = self.ui.canvas.height();
    self.ui.canvas.html('');
    self.ui.paper = Raphael( 'canvas', w, h );
    self.ui.paper.clear();
    self.ui.paper.drawGrid( rz/2, rz/2, w - rz, h - rz, (w-rz)/rz, (h-rz)/rz, "#ccc");
    self.boxes.paper = self.ui.paper; 

  };

  self.init();
  self.render();

};


var Boxes = function ( opts ) {
  var self = this;
  this.boxes = [];
  this.panel = opts.panel;
  this.paper = opts.paper;

  this.add = function (opts) {
    opts.boxes = self;
    opts.panel = self.panel;
    opts.paper = self.paper;
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

var Box = function (opts) {
  var self = this;
  this.opts = opts || {};
  this.opts.x = this.opts.x || 8;
  this.opts.y = this.opts.y || 8;
  this.cid = _.uniqueId('box');

  this.ui = {};

  this.snap = function (n) {
    return Math.round ( n / 8 ) * 8;
  }

  this.render = function() {

    self.ui.outlets.html('');

    $('<li />')
      .appendTo(self.ui.outlets)
      .draggable({ 
        zIndex:999,
        cursor:'pointer',
        revert: 'invalid',
        revertDuration: 250,
        helper: 'clone',
        containment: self.opts.panel,
        start: function ( event, ui ) {
          self.disableMove = true;
          // store the path and some expensive values in the helper
          // object
          var w = $(this).width();
          var h = Math.floor($(this).height()/2);
          var x = $(this).offset().left - self.opts.panel.offset().left;
          var y = $(this).offset().top - self.opts.panel.offset().top;
          ui.helper.path = { cable: false, x: x + w, y: y + h, h: h };
        },	
        drag: function ( event, ui ) {
          var x = ui.helper.offset().left - self.opts.panel.offset().left;
          var y = ui.helper.offset().top - self.opts.panel.offset().top;
           if ( ui.helper.path.cable ) {
             ui.helper.path.cable.remove();
           }
          var p = ui.helper.path;
          // work out the SVG
          var s = 'M' + p.x + ' ' + p.y + 'L' + x + ' ' + ( y + p.h ) + '';
          ui.helper.path.cable = self.opts.paper.path( s ).attr({'stroke':'#888','stroke-width':4});
        },
        stop: function ( event, ui ) {
           if ( ui.helper.path.cable ) {
             ui.helper.path.cable.remove();
           }
        }
      });
    

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

  this.ui.inlets = $('<ul class="inlets" />').appendTo(this.el);
  this.ui.outlets = $('<ul class="outlets" />').appendTo(this.el);

  $('<a class="delete">&times;</a>')
    .appendTo(self.el)
    .bind('click', function (e) {
      e.preventDefault();
      $(e.target).parents('div:first').fadeOut(250, function() {
        self.opts.boxes.del(self.cid);
        $(self).remove();
      });
    });

  this.render();

}

Raphael.fn.drawGrid = function (x, y, w, h, wv, hv, color) {
  color = color || "#000";
  var path = ["M", x, y, "L", x + w, y, x + w, y + h, x, y + h, x, y],
  rowHeight = h / hv,
  columnWidth = w / wv;
  for (var i = 1; i < hv; i++) {
    path = path.concat(["M", x, y + i * rowHeight, "L", x + w, y + i * rowHeight]);
  }
  for (var i = 1; i < wv; i++) {
    path = path.concat(["M", x + i * columnWidth, y, "L", x + i * columnWidth, y + h]);
  }
  return this.path(path.join(",")).attr({stroke: color});
};
