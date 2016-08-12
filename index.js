var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var usernames = [];
app.get('/', function (req, res) {
    res.sendfile('index.html');
});
// =============================================
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/socketiochatdb'); //%%chatapp=Database%%
// obtain an instance of the connection for notifications
// =============================================
var db = mongoose.connection;
db.on('error', function (err) {
    console.log('Connection error: ', err);
});
db.once('open', function (callback) {
    console.log('Successfully connected to MongoDB');
});
// defining schemas
// =============================================
var Schema = mongoose.Schema;
var ChatSchema = new Schema({
    user: String
    , message: String
    , date: {
        type: Date
        , default: Date.now
    }
});
mongoose.model('ChatHistoryCol', ChatSchema);
// creating a Post and saving it in the database
// =============================================
var ChatHistoryMod = mongoose.model('ChatHistoryCol');

io.on('connection', function (socket) {
    ChatHistoryMod.find({}, function (err, docsCallback) {
        if (err) throw err;
        console.log('Sending old messages');
        socket.emit('old messages', docsCallback);
    });
    console.log('a user connected');
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
    socket.on('add user', function (data) {
        console.log('new user: ' + data);
        socket.username = data;
        usernames.push(socket.username);
        io.emit('new user', usernames);
    });
    socket.on('add message', function (data) {
        console.log('message: ' + data);
        
        var newMessage = new ChatHistoryMod({message: data, user: socket.username});
        newMessage.save(function (err) {
            if (err) throw err;
            io.emit('new message', {
                message: data
                , user: socket.username
            });
        });
    });
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});