import { Component, OnInit, ViewChild, ElementRef, OnDestroy, ɵCodegenComponentFactoryResolver } from '@angular/core';
import { AngularFirestore, DocumentReference, AngularFirestoreDocument } from '@angular/fire/firestore';
import { ToastHelper } from 'src/app/helper/toast.helper';
import { Subscription, Observable } from 'rxjs';
import { TalkContent } from '../talk.content';
import { TalkService } from 'src/app/services/talk.service';
import { ActivatedRoute } from '@angular/router';
import { RouterHelper } from 'src/app/helper/router.helper';
import * as firebase from 'firebase';
import { RoomContent } from './room.content';

@Component({
  selector: 'app-talk-room',
  templateUrl: './room.component.html',
  styleUrls: ['../talk.component.css', './room.component.css'],
})
export class RoomComponent implements OnInit, OnDestroy {
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
  talkSub: Subscription;
  roomSub: Subscription;
  selectedRoomSub: Subscription;

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
  talkContents: Array<TalkContent>;
  roomsObserver: Observable<RoomContent[]>;
  roomContents: Array<RoomContent>;
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
  isMobileDevice: boolean;
  localCanvasZoom: number;
  sessionStorage: Storage;
  isCaller: boolean;
  mediaDevices: any;

  // sessionStorage.getItem('createdRoomId');
  // sessionStorage.getItem('joinedRoomUrl');

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
    this.localCanvasZoom = 1;
    this.sessionStorage = window.sessionStorage;
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
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302',
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
    };
    // tslint:disable-next-line: deprecation
    if (window.orientation === undefined) {
      this.deviceRotation = 90;
      this.isMobileDevice = false;
    } else {
      // tslint:disable-next-line: deprecation
      this.deviceRotation = Number(window.orientation);
      this.isMobileDevice = true;
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
        this.roomsObserver = this.talkService.getRoomsObserver(this.talkContents[0].id);
        this.roomSub = this.roomsObserver.subscribe(async (roomContents) => {
          this.roomContents = roomContents;

          // Run on First Rendering
          if (params.roomId && !this.roomId) {
            this.roomId = params.roomId;
            this.isInRoom = true;
            await this.openUserMedia();
            const videoFps = this.mediaContraints.video.frameRate.ideal;
            this.localCanvasInterval = setInterval(this.drawContext.bind(
              this, this.localVideo, this.localCanvas
            ), 1000 / videoFps);
            window.addEventListener('resize', this.onResizeWindow.bind(this));
            const currentRoom = this.roomContents.find(
              (roomContent) => roomContent.id === params.roomId
            );
            if (
              !currentRoom ||
              (currentRoom.answer && currentRoom.offer)
            ) {
              const paramss = Object.assign({}, this.params);
              delete paramss.roomId;
              this.routerHelper.goToTalk(paramss);
              return;
            }
            const isCaller = !currentRoom.offer;
            this.joinRoomById(params.roomId, isCaller);
            this.isLoading = false;
            this.onResizeWindow();
            return;
          }
          this.isLoading = false;
        });
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
      if (this.isMobileDevice && this.localStream) {
        this.setMediaStatus(this.localStream, 'Video', this.isLocalVideoOn);
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
      this.shareStream = await this.mediaDevices[`getDisplayMedia`]({video: true});
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

  handleClickCreateRoom() {
    this.firestore
    .collection('talks').doc(this.talkContents[0].id)
    .collection('rooms').add({}).then(async (roomDoc) => {
      await roomDoc.update({
        id: roomDoc.id,
        createdAt: Number(new Date()),
      });
      const params = Object.assign({}, this.params);
      params.roomId = roomDoc.id;
      this.routerHelper.goToTalk(params);
    });
    return;
  }

  async joinRoomById(roomId: string, isCaller: boolean) {
    if (!roomId) {
      console.error(`There is no roomId`);
      return;
    }
    this.isInRoom = true;
    this.isCaller = isCaller;
    const roomDoc: AngularFirestoreDocument<RoomContent> = this.firestore
    .collection<TalkContent>('talks').doc(this.talkContents[0].id)
    .collection<RoomContent>('rooms').doc(`${roomId}`);
    const roomRef = roomDoc.ref;
    // tslint:disable-next-line: no-console
    this.createdRoomUrl = `${window.location.href}`;
    this.selectedRoomSub = roomDoc.valueChanges().subscribe(async (currrenRoom) => {
      if (this.peerConnection?.remoteDescription && this.peerConnection?.localDescription) {
        if (!currrenRoom?.offer || !currrenRoom?.answer) {
          this.peerConnection.close();
          delete this.peerConnection;
          this.remoteStream?.getTracks().forEach(track => { track.stop(); });
          delete this.remoteStream;
          if (!isCaller) {
            await this.onDisconnect(roomId, false, {answer: firebase.firestore.FieldValue.delete()});
            location.reload();
          }
        }
      }

      if (!this.peerConnection){
        this.peerConnection = new RTCPeerConnection(this.configuration);
        this.collectIceCandidates(
          roomRef,
          this.peerConnection,
          isCaller ? this.callerCandidatesString : this.calleeCandidatesString,
          isCaller ? this.calleeCandidatesString : this.callerCandidatesString,
        );
        this.registerPeerConnectionListeners(roomId, isCaller);
        this.canvasStream.getTracks().forEach(track => {
          this.peerConnection.addTrack(track, this.canvasStream);
        });
        this.remoteStream = new MediaStream();
        this.remoteVideo.nativeElement.srcObject = this.remoteStream;
        this.remoteVideo.nativeElement.muted = false;
        this.remoteVideo.nativeElement.autoplay = true;
        this.remoteVideo.nativeElement.play();
        this.remoteVideo.nativeElement.setAttribute('playsinline', '');
      }
      if (
        !this.peerConnection.remoteDescription &&
        isCaller ? currrenRoom?.answer : currrenRoom?.offer
      ) {
        this.peerConnection.addEventListener('track', event => {
          // tslint:disable-next-line: no-console
          console.log('Got remote track:', event.streams[0]);
          event.streams[0].getTracks().forEach(track => {
            // tslint:disable-next-line: no-console
            console.log('Add a track to the remoteStream:', track);
            this.remoteStream.addTrack(track);
          });
        });
        const rtcSessionDescription = new RTCSessionDescription(
          isCaller ? currrenRoom.answer : currrenRoom.offer
        );
        await this.peerConnection.setRemoteDescription(rtcSessionDescription);
      }
      if (!this.peerConnection.localDescription) {
        if (isCaller) {
          const offer = await this.peerConnection.createOffer();
          await this.peerConnection.setLocalDescription(offer);
          // tslint:disable-next-line: no-console
          console.log('Created offer:', offer);
          await roomRef.update({
            offer: {
              type: offer.type,
              sdp: offer.sdp,
            }
          });
        }
        else {
          const answer = await this.peerConnection.createAnswer();
          // tslint:disable-next-line: no-console
          console.log('Created answer:', answer);
          await this.peerConnection.setLocalDescription(answer);
          await roomRef.update({
            answer: {
              type: answer.type,
              sdp: answer.sdp,
            }
          });
        }
      }
    });
  }

  handleClickJoinRoom() {
    this.toastHelper.showPrompt('Join Talk', 'Please Enter TalkRoom Url')
    .then(async (roomUrl) => {
      if (!roomUrl.value) {
        return;
      }
      // tslint:disable-next-line: no-console
      console.log('Join Room URL: ', roomUrl.value);
      this.routerHelper.goToUrl(roomUrl.value);
      return;
    }).catch((error) => {
      this.toastHelper.showError('Join Talk', error);
    });
  }

  handleClickRemoveRoom(roomId) {
    if (!roomId) {
      return;
    }
    this.talkService.delete(`talks/${this.talkContents[0].id}/rooms/${roomId}`);
  }

  collectIceCandidates(
    roomRef: DocumentReference,
    peerConnection: RTCPeerConnection,
    localName: string,
    remoteName: string,
  ) {
    peerConnection.addEventListener('icecandidate', event => {
      if (event.candidate) {
        const json = event.candidate.toJSON();
        roomRef.collection(localName).add(json);
      }
    });

    roomRef.collection(remoteName).onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          console.warn('new candidate : ', candidate);
          setTimeout(() => {
            peerConnection.addIceCandidate(candidate);
          }, 500);
        }
      });
    });
  }

  async openUserMedia() {
    if (!this.isInRoom) {
      console.error(`isInRoom is false`);
      return;
    }
    const navi: any = navigator;
    this.mediaDevices = navigator.mediaDevices ||
    ((navi.mozGetUserMedia || navi.webkitGetUserMedia) ? {
      getUserMedia(c) {
        return new Promise((y, n) => {
          (navi.mozGetUserMedia ||
            navi.webkitGetUserMedia).call(navigator, c, y, n);
        });
      }
    } : null);

    if (!this.mediaDevices) {
      // tslint:disable-next-line: no-console
      console.log('getUserMedia() not supported.');
      return;
    }

    const stream = await this.mediaDevices.getUserMedia({video: true, audio: true});
    this.localVideo.nativeElement.srcObject = stream;
    this.localVideo.nativeElement.muted = true;
    this.localVideo.nativeElement.autoplay = true;
    this.localVideo.nativeElement.play();
    this.localVideo.nativeElement.setAttribute('playsinline', '');
    this.localStream = stream;
    if (/Firefox/g.test(navigator.userAgent)) {
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
    this.canvasVideo.nativeElement.autoplay = true;
    this.canvasVideo.nativeElement.setAttribute('playsinline', '');
  }

  async onDisconnect(roomId: string, isCaller: boolean, data: any) {
    const removePromise = [];
    const roomDoc = this.firestore
    .collection('talks').doc(this.talkContents[0].id)
    .collection('rooms').doc(roomId);

    roomDoc.collection(
      isCaller ? this.callerCandidatesString : this.calleeCandidatesString
    ).get().forEach(async candidate => {
      candidate.forEach(async can => {
        removePromise.push(can.ref.delete());
      });
    });
    removePromise.push(roomDoc.ref.update(data));
    return Promise.all(removePromise);
  }

  async leaveRoom(roomId) {
    this.isInRoom = false;
    this.isCopiedToClipboard = false;
    this.isScreenSharing = false;
    this.localStream?.getTracks().forEach(track => { track.stop(); });
    this.remoteStream?.getTracks().forEach(track => { track.stop(); });
    this.canvasStream?.getTracks().forEach(track => { track.stop(); });
    this.peerConnection?.close();
    this.createdRoomUrl = '';
    if (roomId) {
      const currentRoom = this.roomContents.find((roomContent) => roomContent.id === roomId);
      await this.onDisconnect(roomId, this.isCaller, {
        [this.isCaller ? 'offer' : 'answer']: firebase.firestore.FieldValue.delete()
      });
    }
    this.selectedRoomSub?.unsubscribe();
  }

  async handleClickLeaveRoom() {
    await this.leaveRoom(this.params.roomId);
    const params = Object.assign({}, this.params);
    delete params.roomId;
    this.routerHelper.goToTalk(params);
  }

  handleClickBackToCreatedRoom(selectedRoomId: string) {
    this.roomId = selectedRoomId;
    this.handleClickCreateRoom();
  }

  handleClickBackToJoinedRoom(selectedRoomUrl: string) {
    this.routerHelper.goToUrl(selectedRoomUrl);
  }

  registerPeerConnectionListeners(roomId: string, isCaller: boolean) {
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

      if (/(disconnected)|(failed)/g.test(this.peerConnection.connectionState)) {
        this.hasRemoteConnection = false;
        await this.onDisconnect(roomId, true, {offer: firebase.firestore.FieldValue.delete()});
        await this.onDisconnect(roomId, false, {answer: firebase.firestore.FieldValue.delete()});
        location.reload();
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
    if(this.isFullScreen) {
      return;
    }

    if (this.videos) {
      const width = this.videos.nativeElement.offsetWidth;
      const height = this.videos.nativeElement.offsetHeight;
      this.isHorizontalVideo = (width / 4) > (height / 3);
    }
    if (this.remoteVideo) {
      const width = this.remoteVideo.nativeElement.offsetWidth;
      const height = this.remoteVideo.nativeElement.offsetHeight;
      this.isVideoButtonGroupHeightMininum = (width / 4) > (height / 3 + 1);
    }
    if (!this.isMobileDevice && this.localCanvas) {
      this.localCanvas.nativeElement.hidden = true;
    }
    if (this.canvasVideo && this.remoteVideo) {
      this.localCanvasZoom =
        this.remoteVideo.nativeElement.offsetWidth / this.localCanvas.nativeElement.width;
    }

    const videoButtons = (document.getElementsByClassName('video-button') as any);
    const buttonSize = this.remoteVideo.nativeElement.offsetWidth / 15;
    for(const buttonElement of videoButtons){
      buttonElement.style.padding = '0';
      buttonElement.style.fontSize = `${buttonSize * 3 / 4}px`;
      buttonElement.style.height = `${buttonSize}px`;
      buttonElement.style.width = `${buttonSize}px`;
      buttonElement.style.borderRadius = `${buttonSize}px`;
      buttonElement.style.margin = `0 0 ${buttonSize / 3}px ${buttonSize / 2}px`;
    }
  }

  drawContext(videoTag: ElementRef, canvasTag: ElementRef) {
    if (!videoTag?.nativeElement) {
      return;
    }

    const isHorizontal = this.deviceRotation === 90 || this.deviceRotation === -90;
    const width = videoTag.nativeElement.videoWidth;
    const height = videoTag.nativeElement.videoHeight;
    if (width / 4 > height / 3) {
      const overWidth = (width / 4 - height / 3) * 4;
      const canvasWidth = canvasTag.nativeElement.width = width - overWidth;
      const canvasHeight = canvasTag.nativeElement.height = height;
      canvasTag.nativeElement.getContext('2d').drawImage(
        videoTag.nativeElement,
        overWidth / 2, 0, canvasWidth, canvasHeight,
        0, 0, canvasWidth, canvasHeight,
      );
    }
    else if (width / 4 < height / 3) {
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
    this.onResizeWindow();
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    if (this.params.roomId) {
      this.leaveRoom(this.params.roomId);
    }
    clearInterval(this.localCanvasInterval);
    this.paramSub?.unsubscribe();
    this.talkSub?.unsubscribe();
    this.roomSub?.unsubscribe();
    this.selectedRoomSub?.unsubscribe();
    window.removeEventListener('resize', this.onResizeWindow);
  }
}
