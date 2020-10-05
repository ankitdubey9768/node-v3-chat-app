const socket= io()

//Elements
const $messageForm=document.querySelector('#message-form')
const $messageFormInput=$messageForm.querySelector('input')
const $messageFormButton=$messageForm.querySelector('button')
const $sendLocation=document.querySelector('#send-location')
const $messages=document.querySelector('#messages')

//templates

const messageTemplate=document.querySelector('#message-template').innerHTML
const locationMessageTemplate=document.querySelector('#location-message-template').innerHTML
const sidebarsTemplate=document.querySelector('#sidebar-template').innerHTML

//Options ,handling querry into objects
//destructuring const={username,room}
const {username,room}=Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoscroll=()=>{
	//new message element
	const $newMessage=$messages.lastElementChild
	//height of the new message 
	const newMessageStyles=getComputedStyle($newMessage)
	const newMessageMargin=parseInt(newMessageStyles.marginBottom)
	const newMessageHeight=$newMessage.offsetHeight + newMessageMargin
	
	//visible height
	const visibleHeight =$messages.offsetHeight
	//height of the message container
	const containerHeight=$messages.scrollHeight
	//how far Have I scrolled?
	const scrollOfset=$messages.scrollTop + visibleHeight

	if(containerHeight-newMessageHeight <= scrollOfset){
		$messages.scrollTop=$messages.scrollHeight
	}


}

socket.on('message',(message)=>{
	//server(emit)-->client(receive)-->acknowledgement-->server
	//client(emit)-->server(receive)-->acknowledgement-->client
	console.log(message)//we are having the callback function from index.js
	const html=Mustache.render(messageTemplate,{
		username:message.username,
		message:message.text,
		createdAt:moment(message.createdAt).format('h:mm a')
	})
	$messages.insertAdjacentHTML('beforeend',html)
	autoscroll()
})
socket.on('locationMessage',(message)=>{
	const html=Mustache.render(locationMessageTemplate,{
		username:message.username,
		url:message.url,
		createdAt:moment(message.createdAt).format('h:mm a')
	})
	$messages.insertAdjacentHTML('beforeend',html)
	autoscroll()
	// console.log(url)
})

socket.on('roomData',({room,users})=>{
	const html=Mustache.render(sidebarsTemplate,{
		room,
		users
	})
	document.querySelector('#sidebar').innerHTML=html
})


$messageForm.addEventListener('submit',(e)=>{
	e.preventDefault()
	$messageFormButton.setAttribute('disabled','disabled')
	const message=e.target.elements.message.value

	socket.emit('sendmessage',message,(error)=>{
	    $messageFormButton.removeAttribute('disabled')
		$messageFormInput.value=''
		$messageFormInput.focus()
		if(error){
			return console.log(error)
		}
		console.log('Message Delivered')
	});
})
$sendLocation.addEventListener('click',()=>{
	$sendLocation.setAttribute('disabled','disabled')


	if(!navigator.geolocation){
		return alert('Geolocation is not supported by the browser')
	}
	navigator.geolocation.getCurrentPosition((position)=>{
		
		socket.emit('sendlocation',{
			latitude:position.coords.latitude,
			longitude:position.coords.longitude},()=>{
				console.log('location shared')
				$sendLocation.removeAttribute('disabled')
			})

	})
})


socket.emit('join',{username,room},(error)=>{
	if(error){
		alert(error)
		location.href='/'
	}

})
