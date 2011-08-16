$(function() {
  var editor = new Editor( $('#drag' ) );
});

// make the routing a little fancier -- a function that returns the
// svg path

function Editor( el ) {
  
  var self = this;
  this.el = el;
  this.ui = {};

  this.init = function() {

    self.ui.grid = $('<div id="grid" />').appendTo( self.el );
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
        if ( $(e).hasClass('inlet') ) {
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
        if ( ui.helper.hasClass('inlet') ) {
          var src_cid = ui.helper.attr('rel');
          var dst_cid = ui.helper.parents('.box:first').attr('id');
          self.boxes.disconnect(src_cid, dst_cid);
        }
      }
    });

  };

  this.resize = function () {
    var w = $(window).width();
    var h = $(window).height();
    self.ui.palette.css({ 'width': w-16 });
    var t = self.ui.palette.height() + 16;
    self.ui.grid.css({ 'top': t, 'width': w-16, 'height': h-t-8 });
    self.ui.canvas.css({ 'top': t, 'width': w-16, 'height': h-t-8 });
    self.ui.panel.css({ 'top': t, 'width': w-16, 'height': h-t-8 });
    self.render();
  };

  this.render = function () {
    var rz = 16;
    var w = self.ui.canvas.width();
    var h = self.ui.canvas.height();
    self.ui.grid.html('');
    self.ui.gridr = Raphael( 'grid', w, h );
    self.ui.gridr.clear();
    self.ui.gridr.drawGrid( rz/2, rz/2, w - rz, h - rz, (w-rz)/rz, (h-rz)/rz, "#ccc");

    self.ui.canvas.html('');
    self.ui.paper = Raphael( 'canvas', w, h );
    self.ui.paper.clear();
    self.boxes.paper = self.ui.paper; 
    self.boxes.render();
  };

  self.init();
  self.render();


};


var Boxes = function ( opts ) {
  var self = this;
  this.boxes = [];
  this.panel = opts.panel;
  this.paper = opts.paper;

  this.w = 128;
  this.h = 128;

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
          self.disconnect(x, cid);
        });

        _.each(box.outlets, function(x) { 
          self.disconnect(cid, x);
        });
        // now remove the delete target
        self.boxes.splice(i, 1);
        self.render();
        break;
      }
    }
  };

  this.connect = function ( src_cid, dst_cid ) {
    // don't self-connect
    if ( src_cid == dst_cid ) {
      return false;
    }
    var src = self.getByCid(src_cid);
    var dst = self.getByCid(dst_cid);
    // don't double connect
    if ( _.include(dst.inlets, src_cid) ) {
      console.log('Already');
      return false;
    }
    src.addOutlet(dst_cid);
    dst.addInlet(src_cid);
    console.log('connect ', src_cid, dst_cid );
    self.render();
  }

  this.disconnect = function ( src_cid, dst_cid ) {
    console.log( 'disconnect ', src_cid, dst_cid );
    var src = self.getByCid(src_cid);
    var dst = self.getByCid(dst_cid);
    if ( !  _.include(dst.inlets, src_cid) ) {
      console.log('Not Already');
      return false;
    }
    src.removeOutlet(dst_cid);
    dst.removeInlet(src_cid);
    self.render();
  }

  this.render = function() {
    self.paper.clear();
    _.each( self.boxes, function(a) {
      _.each(a.outlets, function(cid) {
        b = self.getByCid(cid);
        //var s = 'M' + ( a.x + self.w)  + ' ' + ( a.y + self.h/2) + 'L' + b.x + ' ' + ( b.y + self.h/2 )  + '';
        var s = self.route ( ( a.x + 128), ( a.y + self.h/2), b.x, ( b.y + self.h/2 ) );
        self.paper.path( s ).attr({'stroke':'#888','stroke-width':4});
      });
    });
  };

  // all the routing is done here - you could make it route around the
  // boxes or do bezier cables like quartz composer

  this.route = function ( ox, oy, ix, iy ) {
    var n = 12;
    var p = '';
    if ( ix > ox ) {
      p = 'M' + ox + ' ' + oy 
        + ' L' + ( ix + ( ( ox - ix ) / 2 ) )  + ' ' + oy
        + ' L' + ( ix + ( ( ox - ix ) / 2 ) )  + ' ' + iy
        + ' L' + ix + ' ' + iy;
    } else if ( ix < ox ) {
      p = 'M' + ox + ' ' + oy  
        + ' L' + ( ox + n ) + ' ' + oy  
        + ' L' + ( ox + n ) + ' ' + ( iy + ( ( oy - iy ) / 2 ) )  
        + ' L' + ( ix - n ) + ' ' + ( iy + ( ( oy - iy ) / 2 ) )  
        + ' L' + ( ix - n ) + ' ' + iy  
        + ' L' + ix + ' ' + iy
    } else {
      p = 'M' + ox + ' ' + oy + 'L' + ix + ' ' + iy;
    }
    return p;
  }

}

var Box = function (opts) {
  var self = this;
  this.opts = opts || {};
  self.panel = opts.panel;
  self.boxes = opts.boxes;
  this.x = this.opts.x || 8;
  this.y = this.opts.y || 8;
  this.cid = _.uniqueId('box');
  this.inlets = [];
  this.outlets = [];
  this.ui = {};

  this.snap = function (n) {
    return Math.round ( n / 8 ) * 8;
  }

  this.addInlet = function (cid) {
    self.inlets.push(cid);
    self.render();
  }

  this.addOutlet = function (cid) {
    self.outlets.push(cid);
    self.render();
  }

  this.removeInlet = function (cid) {
    self.inlets = _.without(self.inlets, cid);
    self.render();
  }

  this.removeOutlet = function (cid) {
    self.outlets = _.without(self.outlets, cid);
    self.render();
  }

  this.el = $('<div class="box" />')
    .attr('id',self.cid)
    .appendTo( self.opts.panel )
    .css({'left': self.snap(self.x), 'top':self.snap(self.y)})
    .draggable({ 
      containment: self.opts.panel,
      stack: '.box',
      drag: function ( event, ui ) {
        self.x = self.snap(ui.helper.offset().left - self.opts.panel.offset().left);
        self.y = self.snap(ui.helper.offset().top - self.opts.panel.offset().top);
        self.opts.boxes.render()
      },
      stop: function ( event, ui ) {
        self.x = self.snap(ui.helper.offset().left - self.opts.panel.offset().left);
        self.y = self.snap(ui.helper.offset().top - self.opts.panel.offset().top);
        $(this).css({'left':self.snap(self.x), 'top': self.snap(self.y)});
        self.opts.boxes.render()
      }
    })
    .droppable({
      hoverClass: "accept",
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
        var from_cid = $(ui.helper).parents('.box').attr('id');
        var to_cid = $(event.target).attr('id');
        // connect the outlet to the box it was dropped on
        self.opts.boxes.connect(from_cid, to_cid);
      }
    })
    .bind('click', function () {
      console.log( 'in: ', self.inlets, 'out: ', self.outlets );
    });

  $('<h3 />').html(self.cid).appendTo(self.el);

  $('<a class="delete">&times;</a>')
    .appendTo(self.el)
    .bind('click', function (e) {
      e.preventDefault();
      $(e.target).parents('div:first').fadeOut(250, function() {
        self.opts.boxes.del(self.cid);
        $(self.el).remove();
      });
    });

  this.ui.inlets = $('<ul class="inlets" />').appendTo(this.el);
  this.ui.outlets = $('<ul class="outlets" />').appendTo(this.el);

  this.render = function() {
    self.ui.inlets.html('');
    self.ui.outlets.html('');

    _.each(self.inlets, function(x){
      $('<li class="inlet" rel="' + x + '" />')
        .appendTo(self.ui.inlets)
        .draggable({ 
          // drag inlet to remove connection
          cursor:'pointer',
          revert: 'invalid',
          revertDuration: 250,
          helper: 'clone'
        });
    });

    _.each(self.outlets, function(x){
      $('<li class="outlet connected" rel="' + x + '" />')
        .appendTo(self.ui.outlets);
    });

    $('<li class="outlet" />')
      .appendTo(self.ui.outlets)
      .draggable({ 
        cursor:'pointer',
        revert: 'invalid',
        revertDuration: 250,
        helper: 'clone',
        containment: self.opts.panel,
        start: function ( event, ui ) {
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
          var s = self.boxes.route ( p.x, p.y, x, (y+p.h) );
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
