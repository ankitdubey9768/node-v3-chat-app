const http =require('http')
const path=require('path')
const express=require('express')
const socketio=require('socket.io')
const Filter=require('bad-words')
const {generateMessage,generateLocationMessage}=require('./utils/messages')
const {addUser,
	removeUser,
	getUser,
	getUsersInRoom
}=require('./utils/users')



const app=express()
const server=http.createServer(app)
const io=socketio(server)//socket io expects to get pure server therefore we are doing the refactoring to the server 


const port=process.env.PORT||3000
const publicDirectoryPath=path.join(__dirname,'../public')
app.use(express.static(publicDirectoryPath))
let count=0
//server (emit)->client (receive)-countUpdated
//client(emit)->server(receive)-increment
io.on('connection',(socket)=>{
	console.log('new websocket connection')

	socket.on('join',(options,callback)=>{
		const {error,user}=addUser({id:socket.id,...options})

		if(error){
			return callback(error)

		}


		socket.join(user.room)
		socket.emit('message',generateMessage('admin','welcome'))//second argument act as a call back function
	    socket.broadcast.to(user.room).emit('message',generateMessage('admin',`${user.username} has joined!`))
	    io.to(user.room).emit('roomData',{
	    	room:user.room,
	    	users:getUsersInRoom(user.room)
	    })


		//socket.emit ,io.emit,socket.broadcast.emit
		//io.to.emit,socket.broadcast.to.emit
		callback()
	})


	socket.on('sendmessage',(message,callback)=>{
		const user=getUser(socket.id)
		const filter=new Filter()
		if(filter.isProfane(message)){
			return callback('Profanity is not allowed')
		}
		io.to(user.room).emit('message',generateMessage(user.username,message))
		callback()
	
	})
	socket.on('disconnect',()=>{
		const user=removeUser(socket.id)
		if(user){
		   io.to(user.room).emit('message',generateMessage(`${user.username} has left `))
		   io.to(user.room).emit('roomData',{
			room:user.room,
			users:getUsersInRoom(user.room)
		})
		}
		
	})

	// socket.on('increment',()=>{
	// 	count++
	// 	// socket.emit('countUpdated',count)
	// 	io.emit('countUpdated',count)
	// })

	socket.on('sendlocation',(coords,callback)=>{
		const user=getUser(socket.id)
		io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude}, ${coords.longitude}`))
		callback()
	})
})



server.listen(port,()=>{
	console.log('server is up on port')
})
