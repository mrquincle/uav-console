
function droneparameter(parameter, value) {
	var self = this;
	self.parameter = ko.observable(parameter);
	self.value  = ko.observable(value);
}

/*
http://gis.stackexchange.com/questions/5265/using-the-proj4js-library-to-convert-from-google-maps-to-projected-values
http://www.spatialmarkets.com/blog/2012/2/29/proj4js-and-on-the-fly-coordinate-conversion.html
*/

//collects the X and the Y in state plane, and returns a point with the lat/lng in it...
// check http://spatialreference.org/ref/epsg/32633/
// from http://www.dmap.co.uk/utmworld.htm we are in zone 31U and not 31Q
function ConvertStatePlane(x,y) {
	//Proj4js.defs["EPSG:3419"] = "+proj=lcc +lat_1=39.78333333333333 +lat_2=38.71666666666667 +lat_0=38.33333333333334 +lon_0=-98 +x_0=399999.99998984 +y_0=0 +ellps=GRS80 +datum=NAD83 +to_meter=0.3048006096012192 +no_defs";
	Proj4js.defs["GOOGLE"]="+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs";
 	Proj4js.defs["EPSG:4326"] = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
	Proj4js.defs["EPSG:41001"] = "+title=simple mercator EPSG:41001 +proj=merc +lat_ts=0 +lon_0=0 +k=1.000000 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m";
	//Proj4js.defs["SR-ORG:111"] = "+proj=utm +zone=31 +ellps=clrk66 +units=m +no_defs";

	//var source = new Proj4js.Proj('EPSG:3419');
	//var dest = new Proj4js.Proj('EPSG:4326');
	//var source = new Proj4js.Proj('SR-ORG:111'); // UTM
	var source = new Proj4js.Proj("EPSG:41001"); // UTM
	var dest = new Proj4js.Proj('EPSG:4326'); // Google maps
    //var dest = new Proj4js.Proj("GOOGLE");
            
	var point = new Proj4js.Point(x,y);
	Proj4js.transform(source,dest,point);

	alert("Transformed: " + point.y + "," + point.x);  

	return point;
}

/*
 Currently the function name "point" is a misnomer. It should be a drone object
 */
function point(name, lat, long) {
    var self = this;
//    self.id = ko.observable(id);
    self.name = ko.observable(name);
    self.lat = ko.observable(lat);
    self.long = ko.observable(long);

    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(lat, long),
        title: name,
        map: map,
        draggable: true
    });

    self.marker_point = marker;
    self.marker_point.setIcon('gatewing_32x64.png');

    self.hovered = function(data, event){
      var $tr = $(event.target).parent();
      $tr.addClass('hover');
      self.marker_point.setIcon('gatewing_32x64.png');
    };
  
    self.unhovered = function(data, event){
      var $tr = $(event.target).parent();
      $tr.removeClass('hover');
      self.marker_point.setIcon('gatewing_flip_32x64.png');
    };

    self.abortMission = function() {
		alert("Mission aborted for " + self.name() + ", return to base...");
    };

    self.startLanding = function() {
		alert("Landing started for " + self.name() + "...");
    };

    google.maps.event.addListener(marker, 'mouseover', function() {
        /* what should I put here to highlight corresponding row depending on hovered  marker? */
    }.bind(this));    

    //if you need the poition while dragging
    google.maps.event.addListener(marker, 'drag', function() {
        var pos = marker.getPosition();
		var decimals = 6;
        self.lat(Math.round(pos.lat()*Math.pow(10,decimals))/Math.pow(10,decimals));
        self.long(Math.round(pos.lng()*Math.pow(10,decimals))/Math.pow(10,decimals));
    }.bind(this));

    //if you just need to update it when the user is done dragging
    google.maps.event.addListener(marker, 'dragend', function() {
        var pos = marker.getPosition();
		var decimals = 6;
        self.lat(Math.round(pos.lat()*Math.pow(10,decimals))/Math.pow(10,decimals));
        self.long(Math.round(pos.lng()*Math.pow(10,decimals))/Math.pow(10,decimals));
    }.bind(this));
}

var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 14,
    center: new google.maps.LatLng(51.445, 4.34),
    mapTypeId: google.maps.MapTypeId.TERRAIN
});

function DroneViewModel() {
    var self = this;
    self.chosenUAVId = ko.observable();
    self.chosenUAV = ko.observable();

    self.points = ko.observableArray([
        new point('UAV 1', 51.445, 4.34),
        new point('UAV 2', 51.448, 4.344),
        new point('UAV 3', 51.450, 4.338),
        new point('UAV 4', 51.443, 4.337)])

	self.droneparameters = ko.observableArray([
		new droneparameter('Name','anonymous')
	])

    // mission abort of all selected planes
    self.abortMission = function() {
       self.chosenUAV().abortMission();
    };

    // start landing of all selected planes
    self.startLanding = function() {
       self.chosenUAV().startLanding();
    };

    self.goToUAV = function(uav) {
       self.chosenUAVId(uav.name);
       self.chosenUAV(uav);
    };

    self.addUAV = function(name, x, y) {
    	var coord = ConvertStatePlane(x,y);
        self.points.push(new point(name, coord.x, coord.y));
    };

	self.loadUAVs = function () {
		$.getJSON('drone/0', function (dronelist) {
			self.droneparameters.removeAll();
			$.each(dronelist, function (field, value) {
				self.droneparameters.push(new droneparameter(field, value));
			});
			self.addUAV('Test', 8900, 10180);
			//for (var i = 0; i < dronelist.length; i++) {
				if (droneparameters.uav_id == 0) {
					self.addUAV(uav_id, uav_x, uav_y);
				}
			//}			
		});
	};
};
	


$(function () {
	my = { viewModel: new DroneViewModel() };
	ko.applyBindings(my.viewModel);
    my.viewModel.loadUAVs();
});
