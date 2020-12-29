import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/firestore';
import { ToastHelper } from 'src/app/helper/toast.helper';
import { Subscription, Observable } from 'rxjs';
import { TalkContent } from '../talk.content';
import { TalkService } from 'src/app/services/talk.service';
import { ActivatedRoute } from '@angular/router';
import { RouterHelper } from 'src/app/helper/router.helper';
import { resolve } from 'dns';

@Component({
  selector: 'app-talk-room',
  templateUrl: './room.component.html',
  styleUrls: ['../talk.component.css', './room.component.css'],
})
export class RoomComponent implements OnInit {
  // WebRTC Connection
  public localStream: MediaStream;
  public canvasStream: MediaStream;
  public shareStream: MediaStream;
  public remoteStream: MediaStream;
  peerConnection: RTCPeerConnection;
  roomId: string;
  createdRoomUrl: string;
  callerCandidatesString: string;
  calleeCandidatesString: string;
  mediaContraints: any;
  configuration: any;
  isInRoom: boolean;
  params: any;
  paramSub: Subscription;
  roomJoinSubscribe: Subscription;
  talkSub: Subscription;

  @ViewChild ('videos') public videos: any;
  @ViewChild ('localVideo') public localVideo: ElementRef;
  @ViewChild ('canvasVideo') public canvasVideo: ElementRef;
  @ViewChild ('localCanvas') public localCanvas: ElementRef;
  @ViewChild ('remoteVideo') public remoteVideo: ElementRef;
  @ViewChild ('localVideoGroup') public localVideoGroup: ElementRef;
  @ViewChild ('remoteVideoGroup') public remoteVideoGroup: ElementRef;

  isPage: boolean;
  isLoading: boolean;
  isCopiedToClipboard: boolean;
  talkContentsObserver: Observable<TalkContent[]>;
  talkContents: TalkContent[];
  isHorizontalVideo: boolean;
  isLocalVideoOn: boolean;
  isLocalAudioOn: boolean;
  isRemoteVideoOn: boolean;
  isRemoteAudioOn: boolean;
  hasRemoteConnection: boolean;
  isVideoButtonGroupHeightMininum: boolean;
  isScreenSharing: boolean;
  isFullScreen: boolean;
  isShowingLocalControl: boolean;
  isShowingRemoteControl: boolean;
  localCanvasInterval: any;
  deviceRotation: number;

  constructor(
    private firestore: AngularFirestore,
    private toastHelper: ToastHelper,
    private talkService: TalkService,
    private route: ActivatedRoute,
    private routerHelper: RouterHelper,
  ) {
    this.isPage = true;
    this.isLoading = true;
    this.isLocalVideoOn = true;
    this.isLocalAudioOn = true;
    this.isRemoteVideoOn = true;
    this.isRemoteAudioOn = true;
    this.hasRemoteConnection = false;
    this.isCopiedToClipboard = false;
    this.isVideoButtonGroupHeightMininum = false;
    this.isScreenSharing = false;
    this.isFullScreen = false;
    this.isShowingLocalControl = false;
    this.isShowingRemoteControl = false;
    this.callerCandidatesString = 'callerCandidates';
    this.calleeCandidatesString = 'calleeCandidates';
    this.mediaContraints = {
      video: {
        width: { ideal: 640, max: 640 },
        height: { ideal: 480, max: 480 },
        frameRate: { ideal: 15, max: 15 },
      },
      audio: true,
    };
    this.configuration = {
      iceServers: [
        {
          urls: [
            'stun:socket.sansoohan.ga:443',
          ],
        },
        {
          urls: [
            'turn:socket.sansoohan.ga:443?transport=udp',
          ],
          username: '1608961376:sansoohan',
          credential: 'kznEtvX/flyC+5+WRpYELPa5Yz0=',
        }
      ],
      iceCandidatePoolSize: 10,
    };
    // tslint:disable-next-line: deprecation
    if (window.orientation === undefined) {
      this.deviceRotation = 90;
    } else {
      // tslint:disable-next-line: deprecation
      this.deviceRotation = Number(window.orientation);
    }
    window.addEventListener('orientationchange', () => {
      // tslint:disable-next-line: deprecation
      this.deviceRotation = Number(window.orientation);
    });

    this.paramSub = this.route.params.subscribe((params) => {
      this.params = params;
      this.talkContentsObserver = this.talkService.getTalkContentsObserver({params});
      this.talkSub = this.talkContentsObserver.subscribe((talkContents) => {
        this.talkContents = talkContents;
        const videoFps = this.mediaContraints.video.frameRate.ideal;
        this.localCanvasInterval = setInterval(this.drawContext.bind(
          this, this.localVideo, this.localCanvas
        ), 1000 / videoFps);
        window.addEventListener('resize', this.onResizeWindow.bind(this));
        if (params.roomId) {
          this.firestore
          .collection('talks').doc(this.talkContents[0].id)
          .collection('rooms').doc(`${params.roomId}`).get()
          .forEach(async (roomData) => {
            let waitTime = 0;
            if (roomData?.data()?.answer) {
              waitTime = 10000;
            }
            this.roomId = params.roomId;
            setTimeout(() => {
              this.joinRoomById(this.roomId);
              this.isLoading = false;
              this.onResizeWindow();
            }, waitTime);
          });
          return;
        }
        setTimeout(() => this.onResizeWindow(), 300);
        this.isLoading = false;
      });
      document.addEventListener('fullscreenchange', (event) => {
        setTimeout(() => this.onResizeWindow(), 300);
        if (document.fullscreenElement) {
          this.isFullScreen = true;
        } else {
          this.isFullScreen = false;
        }
      });
    });
  }

  setMediaStatus(stream: MediaStream, mediaType: string, status: boolean) {
    stream[`get${mediaType}Tracks`]().forEach((track) => track.enabled = status);
  }

  clickLocalVideoToggle() {
    this.isLocalVideoOn = !this.isLocalVideoOn;
    if (this.isScreenSharing) {
      if (this.shareStream) {
        this.setMediaStatus(this.shareStream, 'Video', this.isLocalVideoOn);
      }
    } else {
      if (this.canvasStream) {
        this.setMediaStatus(this.canvasStream, 'Video', this.isLocalVideoOn);
      }
    }
  }

  clickLocalAudioToggle() {
    this.isLocalAudioOn = !this.isLocalAudioOn;
    if (this.canvasStream) {
      this.setMediaStatus(this.canvasStream, 'Audio', this.isLocalAudioOn);
    }
  }

  clickRemoteVideoToggle() {
    this.isRemoteVideoOn = !this.isRemoteVideoOn;
    if (this.remoteStream) {
      this.setMediaStatus(this.remoteStream, 'Video', this.isRemoteVideoOn);
    }
  }

  clickRemoteAudioToggle() {
    this.isRemoteAudioOn = !this.isRemoteAudioOn;
    if (this.remoteStream) {
      this.setMediaStatus(this.remoteStream, 'Audio', this.isRemoteAudioOn);
    }
  }

  toggleFullScreen(videoGroup: ElementRef) {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      const el: any = videoGroup;
      if (el.requestFullscreen) { el.requestFullscreen(); }
      else if (el.msRequestFullscreen) { el.msRequestFullscreen(); }
      else if (el.mozRequestFullScreen) { el.mozRequestFullScreen(); }
      else if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); }
    }
  }

  async handleClickStartScreenSharing() {
    try {
      this.shareStream = await navigator.mediaDevices[`getDisplayMedia`]({video: true});
      this.setMediaStatus(this.shareStream, 'Video', this.isLocalVideoOn);
      this.canvasVideo.nativeElement.srcObject = this.shareStream;
      const videoSender = this.peerConnection.getSenders().find(sender => {
        return sender.track.kind === 'video';
      });
      const [screenVideoTrack] = this.shareStream.getVideoTracks();
      videoSender.replaceTrack(screenVideoTrack);
      screenVideoTrack.addEventListener('ended', () => {
        this.handleClickStopScreenSharing();
      }, {once: true});
      this.isScreenSharing = true;
    } catch (error) {
      console.error(error);
    }
  }

  async handleClickStopScreenSharing() {
    this.canvasVideo.nativeElement.srcObject = this.canvasStream;
    const videoSender = this.peerConnection.getSenders().find(sender => {
      return sender.track.kind === 'video';
    });
    const [screenVideoTrack] = this.canvasStream.getVideoTracks();
    videoSender.replaceTrack(screenVideoTrack);
    this.isScreenSharing = false;
  }

  async handleClickCreateRoom() {
    this.isInRoom = true;
    await this.openUserMedia();
    let roomRef: DocumentReference;
    if (this.roomId) {
      roomRef = this.firestore
      .collection('talks').doc(this.talkContents[0].id)
      .collection('rooms').doc(this.roomId).ref;
    } else {
      roomRef = await this.firestore
      .collection('talks').doc(this.talkContents[0].id)
      .collection('rooms').add({});
    }

    // tslint:disable-next-line: no-console
    console.log('Create PeerConnection with configuration: ', this.configuration);
    this.peerConnection = new RTCPeerConnection(this.configuration);

    this.registerPeerConnectionListeners();

    this.canvasStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.canvasStream);
    });

    // Uncomment to collect ICE candidates below
    await this.collectIceCandidates(roomRef, this.peerConnection, this.callerCandidatesString, this.calleeCandidatesString);

    // Code for creating a room below
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    // tslint:disable-next-line: no-console
    console.log('Created offer:', offer);
    await roomRef.set({
      id: roomRef.id,
      caller: JSON.parse(localStorage.currentUser || '{}').uid || null,
      createdAt: Number(new Date()),
      offer: {
        type: offer.type,
        sdp: offer.sdp,
      }
    });
    this.roomId = roomRef.id;
    // tslint:disable-next-line: no-console
    console.log(`New room created with SDP offer. Room ID: ${roomRef.id}`);
    this.createdRoomUrl = `${window.location.href}/room/${this.roomId}`;

    // Code for creating a room above
    this.peerConnection.addEventListener('track', event => {
      // tslint:disable-next-line: no-console
      console.log('Got remote track:', event.streams[0]);
      event.streams[0].getTracks().forEach(track => {
        // tslint:disable-next-line: no-console
        console.log('Add a track to the remoteStream:', track);
        this.remoteStream.addTrack(track);
      });
    });

    // Listening for remote session description below
    roomRef.onSnapshot(async snapshot => {
      const data = snapshot.data();
      if (!this.peerConnection.currentRemoteDescription && data && data.answer) {
        // tslint:disable-next-line: no-console
        console.log('Got remote description: ', data.answer);
        const rtcSessionDescription = new RTCSessionDescription(data.answer);
        await this.peerConnection.setRemoteDescription(rtcSessionDescription);
      }
    });
    // Listening for remote session description above
  }

  handleClickJoinRoom() {
    this.toastHelper.showPrompt('Join Talk', 'Please Enter TalkRoom Url')
    .then(async (roomUrl) => {
      if (!roomUrl.value) {
        return;
      }
      const params = Object.assign({roomUrl: roomUrl.value}, this.params);
      // tslint:disable-next-line: no-console
      console.log('Join Room URL: ', roomUrl.value);
      this.routerHelper.goToUrl(roomUrl.value);
    }).catch((error) => {
      this.toastHelper.showError('Join Talk', error);
    });
  }

  async joinRoomById(roomId: string) {
    this.createdRoomUrl = `${window.location.href}/room/${this.roomId}`;
    this.isInRoom = true;
    await this.openUserMedia();
    const roomRef = this.firestore
    .collection('talks').doc(this.talkContents[0].id)
    .collection('rooms').doc(`${roomId}`);

    const roomSnapshot = roomRef.get();
    // tslint:disable-next-line: no-console
    console.log('Got room:', roomRef.ref.id);

    if (roomRef.ref.id) {
      // tslint:disable-next-line: no-console
      console.log('Create PeerConnection with configuration: ', this.configuration);
      this.peerConnection = new RTCPeerConnection(this.configuration);
      this.registerPeerConnectionListeners();
      this.canvasStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.canvasStream);
      });

      // Uncomment to collect ICE candidates below
      await this.collectIceCandidates(roomRef.ref, this.peerConnection, this.calleeCandidatesString, this.callerCandidatesString);

      this.peerConnection.addEventListener('track', event => {
        // tslint:disable-next-line: no-console
        console.log('Got remote track:', event.streams[0]);
        event.streams[0].getTracks().forEach(track => {
          // tslint:disable-next-line: no-console
          console.log('Add a track to the remoteStream:', track);
          this.remoteStream.addTrack(track);
        });
      });

      // Code for creating SDP answer below
      this.roomJoinSubscribe = roomSnapshot.subscribe(async (roomData) => {
        const offer = roomData.data().offer;
        // tslint:disable-next-line: no-console
        console.log('Got offer:', offer);
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peerConnection.createAnswer();
        // tslint:disable-next-line: no-console
        console.log('Created answer:', answer);
        await this.peerConnection.setLocalDescription(answer);

        const roomWithAnswer = {
          answer: {
            type: answer.type,
            sdp: answer.sdp,
          },
        };
        await roomRef.update(roomWithAnswer);
        // Code for creating SDP answer above
      });
    }
  }

  // collect ICE Candidates function below
  async collectIceCandidates(
    roomRef: DocumentReference,
    peerConnection: RTCPeerConnection,
    localName: string,
    remoteName: string,
  ) {
    const candidatesCollection = roomRef.collection(localName);

    peerConnection.addEventListener('icecandidate', event => {
      if (event.candidate) {
        const json = event.candidate.toJSON();
        candidatesCollection.add(json);
      }
    });

    roomRef.collection(remoteName).onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          peerConnection.addIceCandidate(candidate);
        }
      });
    });
  }
  // collect ICE Candidates function above

  async openUserMedia() {
    const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
    this.localVideo.nativeElement.srcObject = stream;
    this.localVideo.nativeElement.muted = true;
    this.localVideo.nativeElement.autoplay = true;
    this.localVideo.nativeElement.play();
    this.localVideo.nativeElement.setAttribute('playsinline', '');
    this.localVideo.nativeElement.playsinline = true;
    this.localStream = stream;
    this.remoteStream = new MediaStream();
    this.remoteVideo.nativeElement.srcObject = this.remoteStream;
    this.remoteVideo.nativeElement.muted = false;
    this.remoteVideo.nativeElement.autoplay = true;
    this.remoteVideo.nativeElement.play();
    this.remoteVideo.nativeElement.setAttribute('playsinline', '');
    // tslint:disable-next-line: no-console
    console.log('Stream:', this.localVideo.nativeElement.srcObject);

    if (/Firefox/g.test(navigator.userAgent)) {
      // tslint:disable-next-line: no-shadowed-variable
      await new Promise((resolve) => {
        setTimeout(async () => {
          resolve();
        }, 3000);
      });
    }

    this.canvasStream = this.localCanvas.nativeElement.captureStream();
    const [localVideoAudio] = this.localStream.getAudioTracks();
    this.canvasStream.addTrack(localVideoAudio);
    this.canvasVideo.nativeElement.srcObject = this.canvasStream;
    this.canvasVideo.nativeElement.muted = true;
    this.remoteVideo.nativeElement.autoplay = true;
    this.canvasVideo.nativeElement.play();
    this.canvasVideo.nativeElement.setAttribute('playsinline', '');
  }

  async handleClickLeaveRoom() {
    this.isInRoom = false;
    this.isCopiedToClipboard = false;
    this.isScreenSharing = false;
    this.roomJoinSubscribe?.unsubscribe();
    const tracks = this.localVideo.nativeElement.srcObject.getTracks();
    tracks.forEach(track => {
      track.stop();
    });

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
    }

    if (this.peerConnection) {
      this.peerConnection.close();
    }

    this.localVideo.nativeElement.srcObject = null;
    this.remoteVideo.nativeElement.srcObject = null;
    this.createdRoomUrl = '';

    // Delete room on hangup
    if (this.roomId) {
      // const roomRef = this.firestore
      // .collection('talks').doc(this.talkContents[0].id)
      // .collection('rooms').doc(this.roomId);
      // const calleeCandidates = await roomRef.collection(this.calleeCandidatesString).get();
      // calleeCandidates.forEach(async candidate => {
      //   candidate.forEach(async can => {
      //     can.ref.delete();
      //   });
      // });
      // const callerCandidates = await roomRef.collection(this.callerCandidatesString).get();
      // callerCandidates.forEach(async candidate => {
      //   candidate.forEach(async can => {
      //     can.ref.delete();
      //   });
      // });
      // await roomRef.delete();
      // const params = Object.assign({}, this.params);
      // delete params.roomId;
      // this.routerHelper.goToTalk(params);
    }
  }

  registerPeerConnectionListeners() {
    this.peerConnection.addEventListener('icegatheringstatechange', () => {
      // tslint:disable-next-line: no-console
      console.log(`ICE gathering state changed: ${this.peerConnection.iceGatheringState}`);
    });
    this.peerConnection.addEventListener('connectionstatechange', async () => {
      // tslint:disable-next-line: no-console
      console.log(`Connection state change: ${this.peerConnection.connectionState}`);
      if (this.peerConnection.connectionState === 'connected') {
        this.hasRemoteConnection = true;
      }

      if (this.peerConnection.connectionState === 'disconnected') {
        await this.handleClickCreateRoom();
        const roomRef = this.firestore
        .collection('talks').doc(this.talkContents[0].id)
        .collection('rooms').doc(this.roomId);
        const calleeCandidates = await roomRef.collection(this.calleeCandidatesString).get();
        calleeCandidates.forEach(async candidate => {
          candidate.forEach(async can => {
            can.ref.delete();
          });
        });
      }
    });
    this.peerConnection.addEventListener('signalingstatechange', () => {
      // tslint:disable-next-line: no-console
      console.log(`Signaling state change: ${this.peerConnection.signalingState}`);
    });
    this.peerConnection.addEventListener('iceconnectionstatechange ', () => {
      // tslint:disable-next-line: no-console
      console.log(`ICE connection state change: ${this.peerConnection.iceConnectionState}`);
    });
  }

  copyToClipboard(str: string): void{
    this.isCopiedToClipboard = true;
    const el = document.createElement('textarea');
    el.value = str;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }

  onResizeWindow() {
    if (this.videos) {
      const width = this.videos.nativeElement.offsetWidth;
      const height = this.videos.nativeElement.offsetHeight;
      this.isHorizontalVideo = (width / 4) > (height / 3);
    }
    if (this.localVideo) {
      const width = this.localVideo.nativeElement.offsetWidth;
      const height = this.localVideo.nativeElement.offsetHeight;
      this.isVideoButtonGroupHeightMininum = (width / 4) > (height / 3 + 3);
    }
  }

  drawContext(videoTag: ElementRef, canvasTag: ElementRef) {
    if (!videoTag?.nativeElement) {
      return;
    }

    const isHorizontal = this.deviceRotation === 90 || this.deviceRotation === -90;
    const width = videoTag.nativeElement.videoWidth;
    const height = videoTag.nativeElement.videoHeight;
    if (width / 4 > height / 3){
      const overWidth = (width / 4 - height / 3) * 4;
      const canvasWidth = canvasTag.nativeElement.width = width - overWidth;
      const canvasHeight = canvasTag.nativeElement.height = height;
      canvasTag.nativeElement.getContext('2d').drawImage(
        videoTag.nativeElement,
        overWidth / 2, 0, canvasWidth, canvasHeight,
        0, 0, canvasWidth, canvasHeight,
      );
    }
    else if (width / 4 < height / 3){
      const overHeight = (width / 4 - height / 3) * (-3);
      const canvasWidth = canvasTag.nativeElement.width = width;
      const canvasHeight = canvasTag.nativeElement.height = height - overHeight;
      canvasTag.nativeElement.getContext('2d').drawImage(
        videoTag.nativeElement,
        0, overHeight / 2, canvasWidth, canvasHeight,
        0, 0, canvasWidth, canvasHeight,
      );
    }
    else {
      const canvasWidth = canvasTag.nativeElement.width = isHorizontal ? width : height;
      const canvasHeight = canvasTag.nativeElement.height = isHorizontal ? height : height * 3 / 4;
      canvasTag.nativeElement.getContext('2d').drawImage(videoTag.nativeElement,
        0, 0, canvasWidth, canvasHeight
      );
    }
  }

  ngOnInit(): void {
  }

  OnDestroy() {
    clearInterval(this.localCanvasInterval);
    this.handleClickLeaveRoom();
    this.talkSub?.unsubscribe();
    this.paramSub?.unsubscribe();
    window.removeEventListener('resize', this.onResizeWindow);
  }
}
