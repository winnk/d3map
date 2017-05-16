var width = 960,
    height = 500;

var sf = [-122.417, 37.775],
    ny = [-74.0064, 40.7142];

var scale,
    translate,
    visibleArea, // minimum area threshold for points inside viewport
    invisibleArea; // minimum area threshold for points outside viewport

var simplify = d3.geo.transform({
  point: function(x, y, z) {
    if (z < visibleArea) return;
    x = x * scale + translate[0];
    y = y * scale + translate[1];
    if (x >= -10 && x <= width + 10 && y >= -10 && y <= height + 10 || z >= invisibleArea) this.stream.point(x, y);
  }
});

var zoom = d3.behavior.zoom()
    .size([width, height])
    .on("zoom", zoomed);

// This projection is baked into the TopoJSON file,
// but is used here to compute the desired zoom translate.
var projection = d3.geo.mercator()
    .translate([0, 0])
    .scale(4000);

var canvas = d3.select("body").append("canvas")
    .attr("width", width)
    .attr("height", height);

var context = canvas.node().getContext("2d");

var path = d3.geo.path()
    .projection(simplify)
    .context(context);

d3.json("mulnomah.geo.json", function(error, json) {
  if (error) throw error;

  canvas
      .datum(topojson.mesh(topojson.presimplify(json)))
      .call(zoomTo(sf, 4).event)
    .transition()
      .duration(60 * 1000 / 89 * 2)
      .each(jump);
});

function zoomTo(location, scale) {
  var point = projection(location);
  return zoom
      .translate([width / 2 - point[0] * scale, height / 2 - point[1] * scale])
      .scale(scale);
}

function zoomed(d) {
  translate = zoom.translate();
  scale = zoom.scale();
  visibleArea = 1 / scale / scale;
  invisibleArea = 200 * visibleArea;
  context.clearRect(0, 0, width, height);
  context.beginPath();
  path(d);
  context.stroke();
}

function jump() {
  var t = d3.select(this);
  (function repeat() {
    t = t.transition()
        .call(zoomTo(ny, 6).event)
      .transition()
        .call(zoomTo(sf, 4).event)
        .each("end", repeat);
  })();
}
