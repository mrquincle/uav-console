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

function viewModel() {
    var self = this;
    self.chosenUAVId = ko.observable();
    self.chosenUAV = ko.observable();

    self.points = ko.observableArray([
        new point('UAV 1', 51.445, 4.34),
        new point('UAV 2', 51.448, 4.344),
        new point('UAV 3', 51.450, 4.338),
        new point('UAV 4', 51.443, 4.337)])

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

    self.addUAV = function() {
        self.points.push(new point('UAV X', 51.448, 4.34));
    };

};

ko.applyBindings(new viewModel());

