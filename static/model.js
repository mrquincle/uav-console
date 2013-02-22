
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

	self.setlatlong = function(lat,long) {
		var decimals = 6;
        self.lat(Math.round(lat*Math.pow(10,decimals))/Math.pow(10,decimals));
        self.long(Math.round(long*Math.pow(10,decimals))/Math.pow(10,decimals));		
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

	self.points = ko.observableArray([]);
//    self.points = ko.observableArray([
        //new point('UAV 8', 51.445, 4.34),
        //new point('UAV 9', 51.448, 4.344)])

	self.droneparameters = ko.observableArray([]);

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
        //alert("Add drone: " + name + " at lat/long " + x + "," + y);
    	var drone = new point(name, x, y);
        self.points.push(drone);
        drone.setlatlong(x,y);
        if (self.getDroneCount() > 0) {
        	//alert("Drone properly added");
        } else {
        	alert("Adding drone went wrong");
        }
    };

    self.droneUpdate = function(name, x, y) {
    	var point = self.getDrone(name);
    	point.setlatlong(x,y);
    };
    
    self.droneExists = function(name) {
    	for (var i = 0; i < self.points.length; i++) {
    		if (self.points[i].name() == name) {
    			return true;
    		}
    	}
    	return false;
    };
    
    self.getDroneCount = function(name) {
    	return self.points().length;
    };
    
    self.getDrone = function(name) {
    	for (var i = 0; i < self.getDroneCount(); i++) {
    		if (self.points()[i].name() == name) {
    			return self.points()[i];
    		}
    	}
    	alert("Error! You should've called droneExists first.");
    };
    
    self.selectDrone = function(index) {
		self.chosenUAVId() = index;
		var name = "UAV " + index;
		var drone = self.getDrone(name);
		
		//self.droneparameters = [];
		alert("Number of drone parameters: " + drone.parameters().length);
		self.droneparameters.removeAll();
		self.droneparameters = drone.parameters;
    };
    
    self.loadParameters = function(droneparam) {
    	//alert("Reload all parameters");
		self.droneparameters.removeAll();
		$.each(droneparam, function (field, value) {
			self.droneparameters.push(new droneparameter(field, value));
		});    	
    }

	self.loadUAVr = function (index) {
		var url = 'drone/' + index;
		$.getJSON(url, function (droneparam) {
			self.droneparameters.removeAll();
			$.each(droneparam, function (field, value) {
				self.droneparameters.push(new droneparameter(field, value));
				if (field == "uav_id") {
					var name = "UAV " + droneparam.uav_id;
					if (self.droneExists(name)) {
						self.droneUpdate(name, droneparam.uav_x, droneparam.uav_y);
					} else {
						self.addUAV(name, droneparam.uav_x, droneparam.uav_y);
					}
				}
			});
		});
	};

	self.loadUAV = function (index) {
		var url = 'drone/' + index;
		$.getJSON(url, function (droneparam) {
			var name = "UAV " + index;
			self.addUAV(name, droneparam.uav_x, droneparam.uav_y);
			self.loadParameters(droneparam);
			var drone = self.getDrone(name);
			drone.parameters = self.droneparameters;
			self.selectDrone(index);
		});
	};
	
	self.loadUAVs = function () {
		$.getJSON('drone', function (dronelist) {
			//alert("Load this number of drones: " + dronelist.length);
			self.points.removeAll();
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
				self.selectDrone(0);
			} else {
				alert("No drone information available for loading!");
			}
			
		});
	};
	
};

$(function () {
	my = { viewModel: new DroneViewModel() };
	ko.applyBindings(my.viewModel);
	my.viewModel.loadUAVs();
	//my.viewModel.loadUAV(0);
	
	function update() {
	    // retrieve data again
	    my.viewModel.loadUAVs();
	    setTimeout(update, 1000);
	}
	update();
});
