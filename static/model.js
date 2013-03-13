
function droneparameter(parameter, value) {
	var self = this;
	self.parameter = ko.observable(parameter);
	self.value  = ko.observable(value);
}

/*
 Currently the function name "point" is a misnomer. It should be a drone object
 */
function point(name, lat, long) {
	var self = this;
	self.name = ko.observable(name);
	self.lat = ko.observable(lat);
	self.long = ko.observable(long);
	self.parameters = ko.observableArray([]);

//	var history = new google.maps.MVCArray();
//	history.push(new google.maps.LatLng(lat, long));
//	self.history = history;
	
	var trail = new google.maps.Polyline({
		title: "",
		map: map,
		draggable: false
	});
	self.trail = trail;
	
    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(lat, long),
        title: name,
        map: map,
        draggable: false
    });
    self.marker_point = marker;
    self.marker_point.setIcon('gatewing_32x64.png');
    
	var waypoints = new Array();
	for (var i=0; i<3; i++) {
		var waypoint = new google.maps.Marker({
			position: new google.maps.LatLng(lat, long),
			title: "wp",
			map: map,
    		draggable: false
    	});
    	waypoints.push(waypoint);
    }
    self.waypoints = waypoints;
    
    self.update = function () {
    	//alert("lat=" + self.parameters.uav_x + " long=" + self.parameters.uav_y);
    	self.marker_point.setPosition(new google.maps.LatLng(self.parameters.uav_x, self.parameters.uav_y));
		self.setlatlong(self.parameters.uav_x, self.parameters.uav_y);
		
		self.waypoints[0].setPosition(new google.maps.LatLng(self.parameters.dx1, self.parameters.dy1));
		self.waypoints[1].setPosition(new google.maps.LatLng(self.parameters.dx2, self.parameters.dy2));
		self.waypoints[2].setPosition(new google.maps.LatLng(self.parameters.dx3, self.parameters.dy3));
		
//		self.history.push(new google.maps.LatLng(self.parameters.uav_x, self.parameters.uav_y));
//		if (self.history.getLength() > 100) {
//			self.history.removeAt(0);
//		}
//		self.trail.setPath(self.history);
		self.trail.getPath().push(new google.maps.LatLng(self.parameters.uav_x, self.parameters.uav_y));
		if (self.trail.getPath().getLength() > 200) {
			self.trail.getPath().removeAt(0);
		}
    };
    
    self.del = function () {
    	marker.setMap(null);
    	marker = [];
    };
    
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

	self.setlatlong = function(lat,long) {
		var decimals = 6;
        self.lat(Math.round(lat*Math.pow(10,decimals))/Math.pow(10,decimals));
        self.long(Math.round(long*Math.pow(10,decimals))/Math.pow(10,decimals));		
	};

    google.maps.event.addListener(marker, 'mouseover', function() {
        /* what should I put here to highlight corresponding row depending on hovered  marker? */
    }.bind(this));    

    //if you need the position while dragging
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
    //center: new google.maps.LatLng(51.445, 4.34),
    center: new google.maps.LatLng(51.984616, 4.378996),
    mapTypeId: google.maps.MapTypeId.TERRAIN
});



function DroneViewModel() {
    var self = this;
    self.chosenUAVId = ko.observable(); // Used by html
    self.chosenUAV = ko.observable(); // Used for hover?

	self.points = ko.observableArray([]);
	self.droneparameters = ko.observableArray([]); // Used by html
	self.dronecommands = ko.observableArray([]); // Used by html
	
	var areaLine = new google.maps.Polyline({
		title: "area",
		map: map,
		draggable: false
	});
	self.area = areaLine;


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
		self.loadParameters(uav.parameters);
    };

	self.getValue = function(list, param) {
		for (var i = 0; i < list().length; i++) {
			if (list()[i].parameter() == param) 
				return list()[i].value();
		}
		alert("Error: parameter '" + param + "' does not exist!");
	}

	self.setValue = function(list, param, value) {
		for (var i = 0; i < list().length; i++) {
			if (list()[i].parameter() == param) { 
				list()[i].value(value);
				return;
			}
		}
		alert("Error: parameter '" + param + "' does not exist!");
	}

    self.sendCommand = function() {
    	//alert("Number of command parameters: " + self.dronecommands().length);
    	//alert("Send command with version " + self.getValue(self.dronecommands, "version"));
    	var message_id = self.getValue(self.dronecommands, "message_id");
    	var new_id = (parseInt(message_id) + 1).toString();
    	self.setValue(self.dronecommands, "message_id", new_id);
    	var arr = self.dronecommands();
    	//alert("Send command!");
		//$.post("/command", arr, function(returnedData) {
		//	alert("Command is send to the server!");	    
		//})
		$.ajax({
  			url: 'http://localhost:8080/command',
  			data: {commandState: arr},
  			type: 'POST'
		});
    };

    self.addUAV = function(name, x, y) {
    	var uav = new point(name, x, y);
        self.points.push(uav);
    };
    
    self.uavExists = function(name) {
    	for (var i = 0; i < self.points().length; i++) {
    		if (self.points()[i].name() == name) {
    			return true;
    		}
    	}
    	return false;
    };
    
    self.getUavCount = function(name) {
    	return self.points().length;
    };
    
    self.getUAV = function(name) {
    	for (var i = 0; i < self.points().length; i++) {
    		if (self.points()[i].name() == name) {
    			return self.points()[i];
    		}
    	}
    	alert("Error! You should've called droneExists first.");
    };
    
//	self.selectDrone = function(index) {
//		self.chosenUAVId = index;
//		var name = "UAV " + index;
//		var drone = self.getDrone(name);
//		self.droneparameters.removeAll();
//		self.droneparameters = drone.parameters;
//	};
    
	self.loadParameters = function(droneparam) {
		//alert("Reload all parameters");
		self.droneparameters.removeAll();
		$.each(droneparam, function (field, value) {
			self.droneparameters.push(new droneparameter(field, value));
		});
	}
	
	self.loadUAVs = function () {
		$.getJSON('drone', function (dronelist) {

			for (var i = 0; i < dronelist.length; i++) {
				var droneparam = dronelist[i];
				var id = droneparam.uav_id;
				var name = "UAV " + id;
				
				if (self.uavExists(name)) {
					// Update uav
				} else {
					// Add uav
					self.addUAV(name, droneparam.uav_x, droneparam.uav_y);
					
				}
				var uav = self.getUAV(name);
				uav.parameters = droneparam;
				uav.update();
				self.loadParameters(droneparam);				
			}

/*
			// Remove all markers from the map
			for (var i=0; i<self.points().length; i++) {
				self.points()[i].del();
			}

			// Remove all points from the array
			self.points.removeAll();

			// Add new points from dronelist
			for (var i = 0; i < dronelist.length; i++) {
				var droneparam = dronelist[i];
				var index = droneparam.uav_id;
				var name = "UAV " + index;
				self.addUAV(name, droneparam.uav_x, droneparam.uav_y);
				self.loadParameters(droneparam);
				var drone = self.getDrone(name);
				drone.parameters = self.droneparameters;
			}

			var drone_count = self.getDroneCount();
			if (drone_count > 0) {
				//alert("Select drone 0");
				//self.selectDrone(0);
			} else {
				//alert("No drone information available for loading!");
			}
*/
		});
	};
	
	
	
	
	self.drawField = function() {
		$.getJSON('field', function (fieldList) {
			var array = new google.maps.MVCArray();
			//array.push(new google.maps.LatLng(51.984616, 4.378996));
			//array.push(new google.maps.LatLng(51.984616, 4.478996));
			getValue = function(list, param) {
				for (var i = 0; i < list.length; i++) {
					if (list[i].parameter == param) 
						return list[i].value;
				}
			};
			//alert("lat=" + getValue(fieldList, "area_lat_0") + " long=" + getValue(fieldList, "area_long_0"));
			array.push(new google.maps.LatLng(getValue(fieldList, "area_lat_0"), getValue(fieldList, "area_long_0")));
			array.push(new google.maps.LatLng(getValue(fieldList, "area_lat_1"), getValue(fieldList, "area_long_1")));
			array.push(new google.maps.LatLng(getValue(fieldList, "area_lat_2"), getValue(fieldList, "area_long_2")));
			array.push(new google.maps.LatLng(getValue(fieldList, "area_lat_3"), getValue(fieldList, "area_long_3")));
			array.push(new google.maps.LatLng(getValue(fieldList, "area_lat_0"), getValue(fieldList, "area_long_0")));
			self.area.setPath(array);
			//alert(self.area.getPath().getLength());
		});
	}

	self.initCommandState = function() {
		//alert("Number of drone command parameters: " + self.dronecommands().length);
		self.dronecommands.removeAll();
		self.dronecommands.push(new droneparameter("type","cmd"));
		self.dronecommands.push(new droneparameter("version",1));
		self.dronecommands.push(new droneparameter("time_stamp","2013-02-06T13:37:00.0000Z"));
		self.dronecommands.push(new droneparameter("uav_id",10));
		self.dronecommands.push(new droneparameter("message_id",1));
		self.dronecommands.push(new droneparameter("min_height",50));
		self.dronecommands.push(new droneparameter("max_height",100));
		self.dronecommands.push(new droneparameter("area_min_x",594624.0 + 1000));
		self.dronecommands.push(new droneparameter("area_min_y",5760490.0 + 500));
		self.dronecommands.push(new droneparameter("area_dx",1000));
		self.dronecommands.push(new droneparameter("area_dy",3000));
		self.dronecommands.push(new droneparameter("area_rotation",0));
		self.dronecommands.push(new droneparameter("land_x",594624.0 + 1050));
		self.dronecommands.push(new droneparameter("land_y",5760490.0 + 550));
		self.dronecommands.push(new droneparameter("land_heading",4.7124));
		self.dronecommands.push(new droneparameter("turn",true));
		self.dronecommands.push(new droneparameter("auto_pilot_mode",0));
		self.dronecommands.push(new droneparameter("enable_planner",1));
	};
};

$(function () {
	my = { viewModel: new DroneViewModel() };
	ko.applyBindings(my.viewModel);
	my.viewModel.loadUAVs();
	//my.viewModel.loadUAV(0);
	my.viewModel.initCommandState();
	
	function update() {
	    // retrieve data again
	    my.viewModel.loadUAVs();
	    my.viewModel.drawField();
	    setTimeout(update, 1000);
	}				
	
	update();
});
