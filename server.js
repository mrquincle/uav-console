var express    = require('express')
  , app        = module.exports = express.createServer()
  , converter  = require('coordinator')
  , utmtogps   = converter('utm', 'latlong') 
  , gpstoutm   = converter('latlong', 'utm') 
  , jot        = require('json-over-tcp')
  ;

var drones = new Array(); 

var commandState = new Array();

var newCommand = new Boolean();

newCommand = false;

app.configure(function(){
  app.use(express.bodyParser());
  app.use(app.router);
  app.use(express.static(__dirname + '/static'));  //static stuff
  app.use(express.static(__dirname + '/libs')); //js files
});


app.post('/fire', function (request,response) {
  response.send(request.body); //echo
});

app.post('/mission/abort/:id', function (request,response) {
  response.send(request.body); //echo
});

function getvalue(list, param) {
	for (var i = 0; i < list.length; i++) {
		//console.log("Param " + i + " = " + list[i].parameter);
		if (list[i].parameter == param) {
			return list[i].value;
		}
	}
	console.log("Error: parameter '" + param + "' does not exist!");
}


app.post('/command', function(request,response) {
	//console.log(request.body);
	//console.log("Size before: " + commandState.length);
	commandState = request.body.commandState;
	//console.log("Size: " + commandState.length);
	var message_id = getvalue(commandState, "message_id");
	//var message_id = commandState.message_id;
	console.log("Message to be forwarded: " + message_id);
	
	newCommand = true;
});

/*
 Provide API call for drone state information 
*/
app.get('/drone/:id', function (request,response) {
	var droneJSON = JSON.stringify(drones[request.params.id]); 
	response.send(droneJSON); 
});

app.get('/drone', function (request,response) {
	var droneJSON = JSON.stringify(drones); 
	response.send(droneJSON); 
});

app.get('/field', function (request,response) {
	var fieldJSON = JSON.stringify(commandState); 
	response.send(fieldJSON); 
});

var guiPort = 8080;

app.listen(process.argv[2]||guiPort);

var cmdPort = 8082;

var server = jot.createServer(cmdPort);


server.on('connection', newConnectionHandler);

function droneparameter(parameter, value) {
	var self = this;
	self.parameter = parameter;
	self.value = value;
}

function getCommand() {
	var command = new Array();
	command.message_type = getvalue(commandState, "type");
	command.version = getvalue(commandState, "version");
	command.timestamp=getvalue(commandState, "time_stamp");
	command.uav_id=getvalue(commandState, "uav_id");
	command.message_id=getvalue(commandState, "message_id");
	command.min_height=getvalue(commandState, "min_height");
	command.max_height=getvalue(commandState, "max_height");
	command.area_min_x=getvalue(commandState, "area_min_x");
	command.area_min_y=getvalue(commandState, "area_min_y");
	command.area_dx=getvalue(commandState, "area_dx");
	command.area_dy=getvalue(commandState, "area_dy");
	command.area_rotation=getvalue(commandState, "area_rotation");
	command.land_x=getvalue(commandState, "land_x");
	command.land_y=getvalue(commandState, "land_y");
	command.land_heading=getvalue(commandState, "land_heading");
	command.turn=getvalue(commandState, "turn");
	command.auto_pilot_mode=getvalue(commandState, "auto_pilot_mode");
	command.enable_planner=getvalue(commandState, "enable_planner");

	return command;
};


function initialize() {
	commandState = [];
	commandState.push(new droneparameter("type","cmd"));
	commandState.push(new droneparameter("version",1));
	commandState.push(new droneparameter("time_stamp","2013-02-06T13:37:00.0000Z"));
	commandState.push(new droneparameter("uav_id",10));
	commandState.push(new droneparameter("message_id",1));
	commandState.push(new droneparameter("min_height",50));
	commandState.push(new droneparameter("max_height",100));
	commandState.push(new droneparameter("area_min_x",594624.0 + 1000));
	commandState.push(new droneparameter("area_min_y",5760490.0 + 500));
	commandState.push(new droneparameter("area_dx",1000));
	commandState.push(new droneparameter("area_dy",3000));
	commandState.push(new droneparameter("area_rotation",0));
	commandState.push(new droneparameter("land_x",594624.0 + 1050));
	commandState.push(new droneparameter("land_y",5760490.0 + 550));
	commandState.push(new droneparameter("land_heading",4.7124));
	commandState.push(new droneparameter("turn",true));
	commandState.push(new droneparameter("auto_pilot_mode",0));
	commandState.push(new droneparameter("enable_planner",1));
	
	// Add lat/long versions
	var x0 = getvalue(commandState, "area_min_x");
	var y0 = getvalue(commandState, "area_min_y");
	var dx = getvalue(commandState, "area_dx");
	var dy = getvalue(commandState, "area_dy");
	var gps = utmtogps(y0, x0, 31);
	commandState.push(new droneparameter("area_lat_0",gps.latitude));
	commandState.push(new droneparameter("area_long_0",gps.longitude));
	
	gps = utmtogps(y0, x0+dx, 31);
	commandState.push(new droneparameter("area_lat_1",gps.latitude));
	commandState.push(new droneparameter("area_long_1",gps.longitude));
	
	gps = utmtogps(y0+dy, x0+dx, 31);
	commandState.push(new droneparameter("area_lat_2",gps.latitude));
	commandState.push(new droneparameter("area_long_2",gps.longitude));
	
	gps = utmtogps(y0+dy, x0, 31);
	commandState.push(new droneparameter("area_lat_3",gps.latitude));
	commandState.push(new droneparameter("area_long_3",gps.longitude));

};

function droneExists(uav_id) {
	console.log("Find drone: " + uav_id);
	for (var i = 0; i < drones.length; i++) {
		if (drones[i].uav_id == uav_id) 
			return true;
	}
	return false;
};

function getDrone(uav_id) {
	for (var i = 0; i < drones.length; i++) {
		if (drones[i].uav_id == uav_id) 
			return drones[i];
	}
};

// Triggered whenever something connects to the server
function newConnectionHandler(socket){
	// Whenever a connection sends us an object...
	socket.on('data', function(data){
		// Output the question property of the client's message to the console
		console.log("message_type: " + data.message_type);
		if (data.message_type == "pos") {
			console.log("UAV state: " + data.state);
			console.log("Battery level: " + data.battery_left);
			console.log("Check " + drones.length + " existing drones");
			if (!droneExists(data.uav_id)) {
				drones.push(data);
			}
			var index = 0;
			for (var i = 0; i < drones.length; i++) {
				if (drones[i].uav_id == data.uav_id) 
					index = i;
			}
			drones[index] = data;
		
			var gps = utmtogps(drones[index].uav_y, drones[index].uav_x, 31);
			console.log(gps);
			drones[index].uav_x = gps.latitude;
			drones[index].uav_y = gps.longitude;

			gps = utmtogps(drones[index].dy1, drones[index].dx1, 31);
			drones[index].dx1 = gps.latitude;
			drones[index].dy1 = gps.longitude;

			gps = utmtogps(drones[index].dy2, drones[index].dx2, 31);
			drones[index].dx2 = gps.latitude;
			drones[index].dy2 = gps.longitude;

			gps = utmtogps(drones[index].dy3, drones[index].dx3, 31);
			drones[index].dx3 = gps.latitude;
			drones[index].dy3 = gps.longitude;
		}
		
		// Wait 250ms, then write an answer to the client's socket
		setTimeout(function(){
			if (newCommand) {
				var cmd = getCommand();
				socket.write(cmd);
				console.log("Send command to the groundstation!!!!!");
			}
			newCommand = false;
		}, 250);
	});  
};

function calcregion() {
	var lat = 51;
	var long = 4;
	var utm = gpstoutm(lat, long, 31);
        console.log("Easting: " + utm.easting);
        console.log("Northing: " + utm.northing);
};

// Start listening
server.listen(cmdPort);

calcregion();

initialize();

process.on('uncaughtException', function(err) {
	
	console.log(JSON.stringify(err));
});

console.log('Start firefox and point it to http://localhost:' + guiPort);

