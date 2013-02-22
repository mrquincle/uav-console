var express    = require('express')
  , app        = module.exports = express.createServer()
  , converter  = require('coordinator')
  , utmtogps   = converter('utm', 'latlong') 
  , jot        = require('json-over-tcp')
  ;

var drones = new Array(); 

app.configure(function(){
  app.use(express.bodyParser());
  app.use(app.router);
  app.use(express.static(__dirname + '/static'));  //static stuff
  app.use(express.static(__dirname + '/libs')); //js files
});


app.post('/fire', function (request,response) {
  response.send(request.body); //echo
});

app.post('/drone/:abort', function (request,response) {
  response.send(request.body); //echo
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

app.listen(process.argv[2]||8080);

var cmdPort = 8082;

var server = jot.createServer(cmdPort);


server.on('connection', newConnectionHandler);

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
		drone.uav_x = gps.latitude;
		drone.uav_y = gps.longitude;
		
		// Wait one second, then write an answer to the client's socket
		setTimeout(function(){
			socket.write({answer: 42});
		}, 1000);
	});  
};

// Start listening
server.listen(cmdPort);

process.on('uncaughtException', function(err) {
	console.log(JSON.stringify(err));
});

console.log('Start firefox and point it to http://localhost:8082');

