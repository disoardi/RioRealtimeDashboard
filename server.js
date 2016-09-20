var express = require('express');
var app = express();
var path = require('path')
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var myParser = require('body-parser');
var solr = require('solr-client');
var util = require('util');
var sequence = 1;
var clients = [];

app.use(express.static(path.join(__dirname, 'public')))
app.use("/images", express.static(__dirname + '/public/images'));
app.use("/js", express.static(__dirname + '/public/js'));
app.use("/css", express.static(__dirname + '/public/css'));
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
//   Event fired every time a new client connects:
io.on('connection', function(socket) {
    console.info('New client connected (id=' + socket.id + ').');
    clients.push(socket);
//   When socket disconnects, remove it from the list:
    socket.on('disconnect', function() {
        var index = clients.indexOf(socket);
        if (index != -1) {
            clients.splice(index, 1);
            console.info('Client gone (id=' + socket.id + ').');
        }
    });
});

app.use(myParser.urlencoded({extended : false}));
app.use(myParser.json({type: 'application/json'}));

app.post("/from_nifi", function(request, response) {
    console.dir(request.body.GPS_point)
    clients.forEach( function (cli) {
        cli.emit('message', request.body)
    });
    response.sendStatus(200);
    response.end();
});

//query a solr
app.get('/stats', function ( req, res ) {
    cltSolr = solr.createClient("hdpmaster02.ecubecenter.net",8983,"Rio2016", "/solr");
    var query = 'q=*%3A*&rows=0&wt=json&indent=true';
    cltSolr.get('select', query, function(err, obj){
            if(err){
                console.log(err);
            }else{
                console.log(obj);
            }
    });

});


http.listen(8089);
