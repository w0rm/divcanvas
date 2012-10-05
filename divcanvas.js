/*
   
   Drawing polygons using slanted borders technique

   by Andrey Kuzmin  unsoundscapes@gmail.com  MIT licensed

*/

(function() {

  function getInternetExplorerVersion()
  // Returns the version of Internet Explorer or a -1
  // (indicating the use of another browser).
  {
    var rv = -1; // Return value assumes failure.
    if (navigator.appName == 'Microsoft Internet Explorer')
    {
      var ua = navigator.userAgent;
      var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
      if (re.exec(ua) != null)
        rv = parseFloat( RegExp.$1 );
    }
    return rv;
  }

  function DivCanvas(element) {
    this.element = element;
    this.cache = "";
    this.opacity = 1;
    this.transparent = 'transparent';
    this.filter = '';
    
    this.ie = getInternetExplorerVersion();
    if (this.ie > 5 && this.ie < 8) {
      this.transparent = this.ieHackColor;
      this.filter = ";filter: chroma(color=" + this.ieHackColor + ")";
    }
  }

  DivCanvas.prototype = {
    roundMethod: Math.round, // could be parseInt, but looks uglier
    ieHackColor: 'cyan',
    setOpacity: function(opacity) {
      this.opacity = opacity;
      if(this.ie>5 && this.ie<8)
        this.filter =  ";filter:chroma(color=" + this.ieHackColor + ")" +
          (opacity==1 ? "" : " alpha(opacity=" + parseInt(opacity*100) + ")");
      else if (this.ie>5 && this.ie<9)
        this.filter = (opacity==1 ? "" : ";filter:alpha(opacity=" + parseInt(opacity*100) + ")");
      else
        this.filter = opacity==1 ? "" : ";opacity:" + opacity;
      return this;
    },
    triangle: function(x, y, color) {
      this._tri(x, y, color);
      return this;
    },
    polygon: function(x, y, color) {
  		var n = x.length;
  		if (n < 3) return false;
      var V = new Array(n);
  		/* we want a counter-clockwise polygon in V */
  		if ( 0.0 < this._area(x,y) )
  		  for (var v=0; v<n; v++) V[v] = v;
  		else
  		  for (var v=0; v<n; v++) V[v] = (n-1)-v;
  		var nv = n;
  		/*  remove nv-2 Vertices, creating 1 triangle every time */
  		var count = 2 * nv;   /* error detection */
  		for(var m=0, v=nv-1; nv>2; )
  		{
  		  /* if we loop, it is probably a non-simple polygon */
  		  if (0 >= (count--)) return false;  //** Triangulate: ERROR - probable bad polygon!
  		  /* three consecutive vertices in current polygon, <u,v,w> */
  		  var u = v  ; if (nv <= u) u = 0;     /* previous */
  		  v = u+1; if (nv <= v) v = 0;     /* new v    */
  		  var w = v+1; if (nv <= w) w = 0;     /* next     */
  		  if ( this._snip(x,y,u,v,w,nv,V) )
  		  {
  		    var a,b,c,s,t;
  		    /* true names of the vertices */
  		    a = V[u]; b = V[v]; c = V[w];
  		    this._tri([x[c],x[a],x[b]], [y[c],y[a],y[b]], color )
    	    m++;
  		    /* remove v from remaining polygon */
  		    for(s=v,t=v+1;t<nv;s++,t++) V[s] = V[t]; nv--;
  		    /* resest error detection counter */
  		    count = 2*nv;
  		  }
  		}
      return this;  		
    },
    circle: function(x, y, r, color) {
      var dx1=r, dx2, dy1=0, dy2, da = 10;
      for(var a = da; a <= 90; a+= da){
        dx2 = this.roundMethod(r*Math.cos((a) * Math.PI / 180))
        dy2 = this.roundMethod(-r*Math.sin((a) * Math.PI / 180))
        this._trapezoid(x - dx1, y - dy1, dx1 - dx2, dx1 - dx2, dy1 - dy2, dx2 * 2, color)
        this._trapezoid(x - dx1, y + dy1, dx1 - dx2, dx1 - dx2, dy2 - dy1, dx2 * 2, color)
        dx1 = dx2
        dy1 = dy2
      }
      return this;      
    },
    textCircle: function(x, y, r, color) {
      var x = parseInt(x - 1.379*r), 
        y = parseInt(y-2.61*r),
        size = parseInt(r*4.61)
      this.cache += "<span class='p' style='left:"+
        x + "px;top:" + y + "px;font-family:Arial;font-size:" + 
        size + "px; color:" + color + "'>●</span>"
      return this
    },
    flush: function() {
      this.element.innerHTML += this.cache;
      this.cache = "";
      return this;   
    },
    empty: function() {
      this.element.innerHTML = "";
      return this;
    },
    _area: function(x, y) {
      var n = x.length, A = 0.0;
      for(var p=n-1,q=0; q<n; p=q++) 
        A+= x[p] * y[q] - x[q] * y[p];
      return A * 0.5;
    },
    _isInsideTriangle: function(Ax, Ay, Bx, By, Cx, Cy, Px, Py) {
      return (Cx - Bx) * (Py - By) - (Cy - By) * (Px - Bx) >= 0 &&
        (Bx - Ax) * (Py - Ay) - (By - Ay) * (Px - Ax) >= 0 &&
        (Ax - Cx) * (Py - Cy) - (Ay - Cy) * (Px - Cx) >= 0;
    },
    _snip: function(x, y, u, v, w, n, V) {
      var Ax, Ay, Bx, By, Cx, Cy;
      Ax = x[V[u]]; Ay = y[V[u]];
      Bx = x[V[v]]; By = y[V[v]];
      Cx = x[V[w]]; Cy = y[V[w]];
      if ( 0.0000000001 > (Bx-Ax)*(Cy-Ay) - (By-Ay)*(Cx-Ax) ) return false;
      for (var p=0;p<n;p++){
        if( p == u || p == v || p == w ) continue;
        if (this._isInsideTriangle(Ax,Ay,Bx,By,Cx,Cy,x[V[p]],y[V[p]])) return false;
      }
      return true;
    },
    _tri: function(x, y, color) {
      if(x[2]==x[1] || x[2]==x[0] || x[1]==x[0])
        if(y[2]==y[1] || y[2]==y[0] || y[1]==y[0])
          this._rightTri(x, y, color);
        else
          this._splitV(x, y, color);
      else
        this._splitH(x, y, color);
    },
    _sortOrder: function(a) {
      if(a[0] > a[1])
        if(a[1] > a[2])
          return [0, 1, 2];
        else
          return a[0] > a[2] ? [0, 2, 1] : [2, 0, 1];
      else
        if(a[0] > a[2])
          return [1, 0, 2];
        else 
          return a[1] > a[2] ? [1, 2, 0] : [2, 1, 0];
    },
    _splitH: function(x, y, color) {
      var p = this._sortOrder(x);
      if(y[p[0]]==y[p[2]] && x[p[2]] < x[p[1]] < x[p[0]]) {
        this._trapezoid(x[p[2]], y[p[2]], x[p[1]]-x[p[2]],x[p[0]]-x[p[1]],
          y[p[1]]-y[p[0]], 0, color);
        return
      }
      var y0 = this.roundMethod((y[p[2]] - y[p[0]]) * 
        (x[p[1]] - x[p[0]]) / (x[p[2]] - x[p[0]]) + y[p[0]]);
      this._tri([x[p[0]], x[p[1]], x[p[1]]], [y[p[0]], y[p[1]], y0], color);
      this._tri([x[p[2]], x[p[1]], x[p[1]]], [y[p[2]], y[p[1]], y0], color);
    },
    _splitV: function(x, y, color) {
      var p = this._sortOrder(y);
      if(x[p[0]]==x[p[2]] &&  y[p[2]] < y[p[1]] < y[p[0]]) {
        this._trapezoidH(x[p[2]], y[p[2]], y[p[0]]-y[p[1]], 
          y[p[1]]-y[p[2]], x[p[1]]-x[p[0]], 0, color);
        return 
      }
      var x0 = this.roundMethod((x[p[2]] - x[p[0]]) * 
        (y[p[1]] - y[p[0]]) / (y[p[2]] - y[p[0]]) + x[p[0]]);
      this._tri([x[p[0]], x[p[1]], x0], [y[p[0]], y[p[1]], y[p[1]]], color);
      this._tri([x[p[2]], x[p[1]], x0], [y[p[2]], y[p[1]], y[p[1]]], color);
    },
    _rightTri: function(x, y, color) 
      /*
        Iterates through all combinations to find 
        the position of the right corner
      */
    {
      for(var i=0, c; i<6; i++) {
        c = [[0, 1, 2], [1, 2, 0], [2, 0, 1], [1, 0, 2], [0, 2, 1], [2, 1, 0]][i];
        if(x[c[0]]==x[c[1]] && y[c[0]]==y[c[2]])
          return this._rightTriangle(x[c[0]], y[c[0]], x[c[2]]-x[c[0]], y[c[1]]-y[c[0]], color);
      }
    },
    _rightTriangle: function(x, y, dx, dy, color)
      /*
        Draws right triangle based on right angle, 
        endpoint coordinates, and catheti
              |\
              | \
           dy |  \
              |   \
              |    \
        (x,y) o_____\
                 dx
      */
    {
      this.cache += "<div class='p' style='left:" +
        (x + (dx<0 ? dx : 0)) + "px;top:" +
        (y + (dy<0 ? dy : 0)) + "px;border-" +
        (dx>0 ? "left" : "right") + ":" + Math.abs(dx) + "px solid " + color +
        ";border-" + (dy>0 ? "bottom:" : "top:") + Math.abs(dy) + "px solid " + 
        this.transparent + this.filter +
        "'></div>";
    },
    _trapezoid: function(x, y, dx1, dx2, dy, w, color) {
      this.cache += "<div class='p' style='left:" +
        x + "px; top: " +
        (y + (dy < 0 ? dy : 0)) + "px; width: " + w + "px; border-left:" +
        Math.abs(dx1) + "px solid  " + this.transparent + "; border-right:" +
        Math.abs(dx2) + "px solid " + this.transparent + "; border-" + 
        (dy < 0 ? "bottom:" : "top:") + Math.abs(dy) + "px solid " + color + this.filter +
        "'></div>";
    },
    _trapezoidH: function(x, y, dy1, dy2, dx, h, color) {
      this.cache += "<div class='p' style='left:" +
        (x + (dx < 0 ? dx : 0)) + "px; top: " +
        y + "px; height: " + h + "px; border-top:" +
        Math.abs(dy2) + "px solid  " + this.transparent + "; border-bottom:" +
        Math.abs(dy1) + "px solid " + this.transparent + "; border-" + 
        (dx<0 ? "right:" : "left:") + Math.abs(dx) + "px solid " + color + this.filter +
        "'></div>";
    }
  };

  this.DivCanvas = DivCanvas;

}).call(this)

