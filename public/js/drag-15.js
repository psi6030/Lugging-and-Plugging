$(function() {
  var editor = new Editor( $('#drag' ) );
});

// a lot of new stuff here. make boxes accept drops to record
// connections. click on a box to see it's connections. deleting a box
// also deletes it's connections.

function Editor( el ) {
  
  var self = this;
  this.el = el;
  this.ui = {};

  this.init = function() {

    self.ui.canvas = $('<div id="canvas" />').appendTo( self.el );
    self.ui.panel = $('<div id="panel" />').appendTo( self.el );
    self.ui.palette = $('<div id="palette" />').appendTo( self.el );

    self.ui.paper = false;
    self.boxes = new Boxes({panel: self.ui.panel, paper: self.ui.paper});

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

  this.getByCid = function (cid) {
    for ( var i = 0, ii = self.boxes.length; i < ii; i++ ) {
      if ( self.boxes[i].cid == cid ) {
        return self.boxes[i];
        break;
      }
    }
    return false;
  };
  
  this.del = function (cid) {
    for ( var i = 0, ii = self.boxes.length; i < ii; i++ ) {
      if ( self.boxes[i].cid == cid ) {
        // delete references from any connected boxes first
        var box = self.boxes[i];
        _.each(box.inlets, function(x) { 
          self.getByCid(x).outlets = _.without(self.getByCid(x).outlets, cid);
        });

        _.each(box.outlets, function(x) { 
          self.getByCid(x).inlets = _.without(self.getByCid(x).inlets, cid);
        });
        // now remove the delete target
        self.boxes.splice(i, 1);
        break;

      }
    }
  };

  this.connect = function ( from_cid, to_cid ) {
    // ugly first cut of connect -- next step refines it

    // don't self-connect
    if ( from_cid == to_cid ) {
      return false;
    }
    var f = self.getByCid(from_cid).outlets;
    var t = self.getByCid(to_cid).inlets;
    // don't double connect
    if ( _.include(t, from_cid) ) {
      console.log('Already');
      return false;
    }
    f.push(to_cid);
    t.push(from_cid);
    console.log('connect ', from_cid, to_cid );
  }

}

var Box = function (opts) {
  var self = this;
  this.opts = opts || {};
  this.opts.x = this.opts.x || 8;
  this.opts.y = this.opts.y || 8;
  this.cid = _.uniqueId('box');
  this.inlets = [];
  this.outlets = [];

  this.ui = {};

  this.snap = function (n) {
    return Math.round ( n / 8 ) * 8;
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
    })
    .droppable({
      // this is what handles outlets being dropped on a box
      hoverClass: "accept",
      // consume the dropped item
      greedy: true,
      accept: function(e) {
        // only outlets can be dropped on items
        if ( $(e).hasClass('outlet') ) {
          return true;
        }
        return false;
      },
      drop: function(event, ui) {
        // remove the cable that was following the outlet while it was
        // being dragged
        if ( ui.helper.path.cable ) {
          ui.helper.path.cable.remove();
        }
        // work out what the source box was. in the DOM the outlet is
        // still attached to the the .box>ul it was dragged from
        var from_cid = $(ui.helper).parents('.box').attr('id');
        // and the one it was dropped on received the drop event
        var to_cid = $(event.target).attr('id');
        // connect the outlet to the box it was dropped on
        self.opts.boxes.connect(from_cid, to_cid);
      }
    })
    .bind('click', function () {
      console.log( 'in: ', self.inlets, 'out: ', self.outlets );
    });

  this.ui.inlets = $('<ul class="inlets" />').appendTo(this.el);
  this.ui.outlets = $('<ul class="outlets" />').appendTo(this.el);

  $('<h3 />').html(self.cid).appendTo(self.el);

  $('<a class="delete">&times;</a>')
    .appendTo(self.el)
    .bind('click', function (e) {
      e.preventDefault();
      $(e.target).parents('div:first').fadeOut(250, function() {
        self.opts.boxes.del(self.cid);
        $(self).remove();
      });
    });

  this.render = function() {
    self.ui.outlets.html('');

    // we differentiate between inlets and outlets now
    $('<li class="outlet" />')
      .appendTo(self.ui.outlets)
      .draggable({ 
        zIndex: 999,
        cursor:'pointer',
        revert: 'invalid',
        revertDuration: 250,
        helper: 'clone',
        containment: self.opts.panel,
        start: function ( event, ui ) {
          // make sure all boxes will be behind this outlet when we
          // drag it
          $('.box').css({'z-index': 10});
          self.el.css({'z-index': 20});
          self.disableMove = true;
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
