import { Component, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import * as io from "socket.io-client/dist/socket.io";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
	private socket;
	private url;
	localStream:any;
	startButtonDisabled = false;
	callButtonDisabled = true;
	hangupButtonDisabled = true;
	remotePeerConnection:any;
	localPeerConnection:any;
	localVideo: any;
	remoteVideo: any;
	remoteStream: any;

	ngOnInit() {
		this.url = 'https://192.168.1.248:3000'
		this.socket = io(this.url);
		this.socket.emit('message', 'socket connection successful')
		this.socket.on('message', (msg)=>{
			console.log(msg)
		})
  	}

  	ngAfterViewInit(){
  		this.localVideo = document.getElementById('localVideo');
  		this.remoteVideo = document.getElementById('remoteVideo')
  	}

	startAction(){
		this.navigateMediaDevice();
	}

  	navigateMediaDevice(){
  		this.startButtonDisabled = true;
		let mediaStreamConstraints = {
			video: {
				width: {
					min: 500
			    },
			    height: {
					min: 500
			    }
			},
		}
		navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
	  		.then(stream=>{
	  			this.gotLocalMediaStream(stream);
	  		})
	  		.catch(this.handleLocalMediaStreamError);
  	}

	gotLocalMediaStream(mediaStream){
		this.localStream = mediaStream
		let localVideo = document.querySelector('video')
		localVideo.srcObject = mediaStream
		this.callButtonDisabled = false;
	}

	handleLocalMediaStreamError(error){
		console.log('Local Media Stream Error', error)
	}


  	
  	callAction(){
  		this.callButtonDisabled = true;
  		this.hangupButtonDisabled = false;
  		let startTime = window.performance.now();
  		const videoTracks = this.localStream.getVideoTracks();
  		const audioTracks = this.localStream.getAudioTracks();
  		if (videoTracks.length > 0) {
		    console.log(`Using video device: ${videoTracks[0].label}.`);
		}
		if (audioTracks.length > 0) {
	    	console.log(`Using audio device: ${audioTracks[0].label}.`);
		}
		this.rtcPeerConnection();
  	}
	
	hangupAction(){
		console.log("hangup action")
	}

	rtcPeerConnection(){
		let servers = {
            "iceServers": [{ "urls": "stun:stun2.1.google.com:19302" }]
        };
		this.localPeerConnection = new RTCPeerConnection(servers);
		console.log('Created local peer connection object localPeerConnection.')
		this.localPeerConnection.addEventListener('icecandidate', this.handleConnection);
		this.localPeerConnection.addEventListener('iceconnectionstatechange', this.handleConnectionChange);
		
		// this.remotePeerConnection = new RTCPeerConnection(servers);
  // 		console.log('Created remote peer connection object remotePeerConnection.');
  // 		this.remotePeerConnection.addEventListener('icecandidate', this.handleConnection);
  // 		this.remotePeerConnection.addEventListener('iceconnectionstatechange', this.handleConnectionChange);
		// this.remotePeerConnection.addEventListener('addstream', this.gotRemoteMediaStream);

		this.localPeerConnection.addStream(this.localStream);
		console.log('Added local stream to localPeerConnection.');
		console.log('localPeerConnection createOffer start.');

		let offerOptions = {
			offerToReceiveVideo: 1,
		};

		this.localPeerConnection.createOffer(offerOptions)
    		.then(description=>{
    			this.createdOffer(description)
    		})
    		.catch(this.setSessionDescriptionError);
	}

	handleConnection(event){
		let peerConnection = event.target;
		let iceCandidate = event.candidate;
		if (iceCandidate) {
			let newIceCandidate = new RTCIceCandidate(iceCandidate);
			// let otherPeer = this.getOtherPeer(peerConnection);
			let otherPeer = (peerConnection === this.localPeerConnection) ? this.remotePeerConnection : this.localPeerConnection;
debugger;
			otherPeer.addIceCandidate(newIceCandidate)
				.then(() => {
					this.handleConnectionSuccess(peerConnection);
				}).catch((error) => {
					this.handleConnectionFailure(peerConnection, error);
				});

				console.log(`${this.getPeerName(peerConnection)} ICE candidate:\n` +`${event.candidate.candidate}.`);
		}
	}
test(){
		debugger;
}
	handleConnectionChange(){
		debugger;
	}

	gotRemoteMediaStream(event){
		const mediaStream = event.stream;
		let remoteVideo = document.getElementById('remoteVideo')
		remoteVideo['srcObject'] = mediaStream;
		this.remoteStream = mediaStream;
		console.log('Remote peer connection received remote stream.');
	}

	createdOffer(description){
		console.log(`Offer from localPeerConnection:\n${description.sdp}`)
		console.log('localPeerConnection setLocalDescription start.')
		this.localPeerConnection.setLocalDescription(description)
			.then(() => {
				this.setLocalDescriptionSuccess(this.localPeerConnection);
		    	this.socket.emit('offer', {offer: this.localPeerConnection.localDescription})
		    })
		    .catch(this.setSessionDescriptionError);

		// console.log('remotePeerConnection setRemoteDescription start.');
		// this.remotePeerConnection.setRemoteDescription(description)
		// 	.then(() => {
		// 		this.setRemoteDescriptionSuccess(this.remotePeerConnection);
		// 	})
		// 	.catch(this.setSessionDescriptionError);

		// console.log('remotePeerConnection createAnswer start.');
		// this.remotePeerConnection.createAnswer()
		// 	.then(this.createdAnswer)
		// 	.catch(this.setSessionDescriptionError);
	}

	handleOffer(description) {
		console.log('remotePeerConnection setRemoteDescription start.');
		this.localPeerConnection.setRemoteDescription(description)
			.then(() => {
				this.setRemoteDescriptionSuccess(this.remotePeerConnection);
			})
			.catch(this.setSessionDescriptionError);

		console.log('remotePeerConnection createAnswer start.');
		this.localPeerConnection.createAnswer()
			.then(this.createdAnswer)
			.catch(this.setSessionDescriptionError);
	}

	getOtherPeer(peerConnection){
		debugger;
		return (peerConnection === this.localPeerConnection) ? this.remotePeerConnection : this.localPeerConnection;
	}

	setSessionDescriptionError(error){
		console.log(`Failed to create session description: ${error.toString()}.`)
	}

	handleConnectionSuccess(peerConnection){
		debugger;
	}

	handleConnectionFailure(peerConnection, error){
		debugger;
	}

	setLocalDescriptionSuccess(peerConnection){
		this.setDescriptionSuccess(peerConnection, 'setLocalDescription');
	}

	setRemoteDescriptionSuccess(peerConnection){
		this.setDescriptionSuccess(peerConnection, 'setRemoteDescription');
	}

	createdAnswer(description){
		console.log(`Answer from remotePeerConnection:\n${description.sdp}.`);

		console.log('remotePeerConnection setLocalDescription start.');
		this.localPeerConnection.setLocalDescription(description)
		.then(() => {
			this.setLocalDescriptionSuccess(this.localPeerConnection);
			this.socket.emit('answer', {answer: this.localPeerConnection.localDescription})
		}).catch(this.setSessionDescriptionError);

		// console.log('localPeerConnection setRemoteDescription start.');
		// this.localPeerConnection.setRemoteDescription(description)
		// .then(() => {
		// 	this.setRemoteDescriptionSuccess(this.localPeerConnection);
		// }).catch(this.setSessionDescriptionError);
	}

	handleAnswer(description) {
		console.log('localPeerConnection setRemoteDescription start.');
		this.localPeerConnection.setRemoteDescription(description)
		.then(() => {
			this.setRemoteDescriptionSuccess(this.localPeerConnection);
		}).catch(this.setSessionDescriptionError);
	}

	setDescriptionSuccess(peerConnection, functionName) {
		const peerName = this.getPeerName(peerConnection);
		console.log(`${peerName} ${functionName} complete.`);
	}

	getPeerName(peerConnection) {
		return (peerConnection === this.localPeerConnection) ?'localPeerConnection' : 'remotePeerConnection';
	}
}
