var express    = require('express')
  , app        = module.exports = express.createServer()
  , converter  = require('coordinator')
  , utmtogps   = converter('utm', 'latlong') 
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
	command.message_type = getvalue(commandState, "message_type");
	command.version = getvalue(commandState, "version");
	command.timestamp=getvalue(commandState, "timestamp");
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
	commandState.push(new droneparameter("message_type","cmd"));
	commandState.push(new droneparameter("version",1));
	commandState.push(new droneparameter("timestamp","2013-02-06T13:37:00.0000Z"));
	commandState.push(new droneparameter("uav_id",10));
	commandState.push(new droneparameter("message_id",1));
	commandState.push(new droneparameter("min_height",50));
	commandState.push(new droneparameter("max_height",100));
	commandState.push(new droneparameter("area_min_x",9000));
	commandState.push(new droneparameter("area_min_y",9500));
	commandState.push(new droneparameter("area_dx",1000));
	commandState.push(new droneparameter("area_dy",3000));
	commandState.push(new droneparameter("area_rotation",0));
	commandState.push(new droneparameter("land_x",9050));
	commandState.push(new droneparameter("land_y",9550));
	commandState.push(new droneparameter("land_heading",4.7124));
	commandState.push(new droneparameter("turn",true));
	commandState.push(new droneparameter("auto_pilot_mode",0));
	commandState.push(new droneparameter("enable_planner",1));
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
		console.log("UAV state: " + data.state);
		console.log("Battery level: " + data.battery_left);
		console.log("Check " + drones.length + " existing drones");
		if (!droneExists(data.uav_id)) {
			drones.push(data);
		}
		var drone = getDrone(data.uav_id);
		drone = data;
		
		var gps = utmtogps(drone.uav_x, drone.uav_y, 31);
		console.log(gps);
		drone.uav_x = gps.longitude;
		drone.uav_y = gps.latitude;
		
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

// Start listening
server.listen(cmdPort);

initialize();

process.on('uncaughtException', function(err) {
	console.log(JSON.stringify(err));
});

console.log('Start firefox and point it to http://localhost:' + guiPort);

