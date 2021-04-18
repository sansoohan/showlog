'use strict';

import { Component, OnInit, ElementRef, ViewChild, OnDestroy, Input } from '@angular/core';
import { AngularFireDatabase, AngularFireList } from '@angular/fire/database';
import { Subscription } from 'rxjs';
import { RouterHelper } from 'src/app/helper/router.helper';
import { ActivatedRoute } from '@angular/router';
import { TalkContent } from '../talk.content';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { environment } from 'src/environments/environment';

declare var MediaRecorder: any;

@Component({
  selector: 'app-talk-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})

export class RoomComponent implements OnInit, OnDestroy {
  @ViewChild ('localVideo') public localVideo?: ElementRef;
  @ViewChild ('videoContainer') public videoContainer?: ElementRef;
  @ViewChild ('videoBackground') public videoBackground?: ElementRef;
  @ViewChild ('localVideoGroup') public localVideoGroup?: ElementRef;
  @ViewChild ('canvasVideo') public canvasVideo?: ElementRef;
  @ViewChild ('localCanvas') public localCanvas?: ElementRef;
  @ViewChild ('localButtonGroup') public localButtonGroup?: ElementRef;

  localStream?: MediaStream;
  canvasStream?: MediaStream;
  paramSub: Subscription;
  params: any;
  roomId?: string;
  roomBroadcastRef?: AngularFireList<any>;
  broadcastIdRef: any;
  clientRef?: AngularFireList<any>;
  clientId?: string;
  peerConnection?: RTCPeerConnection;
  rtcConfiguration?: RTCConfiguration;

  deviceRotation?: number;
  isFullScreen?: boolean;
  isMobileDevice?: boolean;
  isLocalVideoOn?: boolean;
  isLocalAudioOn?: boolean;
  isScreenSharing?: boolean;
  shareStream?: MediaStream;
  localCanvasInterval: any;
  mediaDevices: any;
  createdRoomUrl?: string;
  isInRoom?: boolean;
  isCopiedToClipboard?: boolean;
  mediaRecorder: any;
  isRecording?: boolean;
  isFinishedRecording?: boolean;
  recordStream?: MediaStream;
  audioContextForRecord?: AudioContext;
  destinationForRecord?: MediaStreamAudioDestinationNode;
  recordType: string;

  blogId?: string;
  talkId?: string;

  dataDebugFlag = false;
  isPage = true;
  databaseRoot?: string;
  videoChunks: Array<any> = [];
  availableGrids: Array<Array<any>> = [[]];
  peerConnections: {[key: string]: any} = {};
  remoteStreams: {[key: string]: any} = {};
  remoteVideos: {[key: string]: any} = {};
  videoWrapers: {[key: string]: any} = {};
  videoButtonGroups: {[key: string]: any} = {};
  isShowingRemoteControl: {[key: string]: any} = {};
  isRemoteAudioOns: {[key: string]: any} = {};
  isRemoteVideoOns: {[key: string]: any} = {};
  audioSourcesForRecording: {[key: string]: any} = {};

  MAX_CONNECTION_COUNT = 3;

  constructor(
    private database: AngularFireDatabase,
    private routerHelper: RouterHelper,
    private route: ActivatedRoute,
  ) {
    this.recordType = `${this.supportsRecording('video/mp4') ? 'video/mp4' : 'video/webm;codecs=h264'}`;
    this.paramSub = this.route.params.subscribe((params) => {
      this.params = params;
      // if (params?.roomId) {
      //   this.startMeeting(params);
      // }
    });
  }

  @Input()
  get talkContent(): TalkContent|undefined { return this._talkContent; }
  set talkContent(talkContent: TalkContent|undefined) {
    if (!talkContent){
      this.isPage = false;
      return;
    }
    this.paramSub = this.route.params.subscribe((params) => {
      this.params = params;
      this.talkId = talkContent.id;
      this.databaseRoot = environment.rootPath + `talks/${this.talkId}/rooms/`;
      this.isPage = true;
      this._talkContent = talkContent;
      this.startMeeting(this.params);
    });
  }
  // tslint:disable-next-line: variable-name
  private _talkContent?: TalkContent;

  async startMeeting(params: any): Promise<void> {
    this.createdRoomUrl = `${window.location.href}`;
    this.params = params;
    this.isInRoom = this.params.roomId ? true : false;
    this.roomId = this.params.roomId;
    this.isCopiedToClipboard = false;
    // this.remoteVideo = document.getElementById('remote_video');
    delete this.localStream;
    // this.peerConnection = null;
    // this.textForSendSdp = document.getElementById('text_for_send_sdp');
    // this.textToReceiveSdp = document.getElementById('text_for_receive_sdp');

    // ---- for multi party -----

    // --- multi video ---
    // this._assert('videoContainer', this.videoContainer.nativeElement);
    this.getRoomName();
    if (!this.roomId) {
      const newParams = Object.assign({}, params);
      newParams.roomId = this.getRoomName();
      this.routerHelper.goToTalk(newParams);
      return;
    }
    // Initialize Firebase

    this.rtcConfiguration = {
      iceServers: [
        {
          urls: [
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302',
            'stun:socket.showlog.me:443',
          ],
        },
        {
          urls: [
            'turn:socket.showlog.me:443?transport=udp',
          ],
          username: '1608961376:sansoohan',
          credential: 'kznEtvX/flyC+5+WRpYELPa5Yz0=',
        }
      ],
    };

    this.isScreenSharing = false;
    this.isLocalVideoOn = true;
    this.isLocalAudioOn = true;

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
    this.isFullScreen = false;
    document.addEventListener('fullscreenchange', (event) => {
      setTimeout(() => this.onResizeWindow(), 300);
      if (document.fullscreenElement) {
        this.isFullScreen = true;
      } else {
        this.isFullScreen = false;
      }
    });
    this.setAvailableGrids(30);
    await this.updateVideoState(this.getVideoLength());
    // this.updateVideoFrameRate(this.getVideoLength());
    this.joinRoom(this.roomId).then(async () => {
      window.addEventListener('resize', this.onResizeWindow.bind(this));
      await new Promise<void>((resolve: any) => {
        setTimeout(async () => {
          resolve();
        }, 2000);
      });
      this.connect();
    });
  }

  copyToClipboard(str?: string): void{
    this.isCopiedToClipboard = true;
    const el = document.createElement('textarea');
    el.value = str || '';
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }

  async handleClickLeaveRoom(): Promise<void> {
    // await this.hangUp();
    // await this.stopVideo();
    await this.ngOnDestroy();
    location.href = `${location.origin}/#/talk/${this.params.userName}`;
  }

  setAvailableGrids(until = 30): void {
    this.availableGrids = [[]];
    for (let videoCount = 1; videoCount < until; videoCount++){
      const availableShortLengthMax = Math.ceil(Math.sqrt(videoCount));
      this.availableGrids.push([]);
      for (let col = 1; col <= availableShortLengthMax; col++){
        const row = Math.ceil(videoCount / col);
        if (col === row) {
          this.availableGrids[videoCount].push({col, row});
        } else {
          this.availableGrids[videoCount].push({col, row}, {col: row, row: col});
        }
      }
    }
  }

  onResizeWindow(): void {
    if (this.isFullScreen) {
      return;
    }

    const backGroundWidth = this.videoBackground?.nativeElement.offsetWidth;
    const backGroundHeight = this.videoBackground?.nativeElement.offsetHeight;
    const videoCount = this.getVideoLength();
    const availableGrids = JSON.parse(JSON.stringify(this.availableGrids[videoCount]));
    const availableLayouts = availableGrids.map((grid: any) => {
      if (backGroundHeight / (grid.row * 3) < backGroundWidth / (grid.col * 4)) {
        grid.videoHeight = backGroundHeight / grid.row;
        grid.videoWidth = grid.videoHeight / 3 * 4;
      } else {
        grid.videoWidth = backGroundWidth / grid.col;
        grid.videoHeight = grid.videoWidth / 4 * 3;
      }
      return grid;
    });

    const indexOfMax = (arr: Array<number>): number => {
      if (arr.length === 0) {
          return -1;
      }
      let max = arr[0];
      let maxIndex = 0;
      for (let i = 1; i < arr.length; i++) {
          if (arr[i] > max) {
              maxIndex = i;
              max = arr[i];
          }
      }
      return maxIndex;
    };

    const bestLayoutIndex = indexOfMax(availableLayouts.map((size: any) => size.videoWidth * size.videoHeight));
    const bestLayout = availableLayouts[bestLayoutIndex];

    // Resizing Video Container
    if (this.videoContainer) {
      this.videoContainer.nativeElement.style.width = `${bestLayout.videoWidth * bestLayout.col}px`;
      this.videoContainer.nativeElement.style.height = `${bestLayout.videoHeight * bestLayout.row}px`;
    }

    if (this.canvasVideo && this.localCanvas) {
      // Resizing Video
      if (this.isMobileDevice) {
        this.canvasVideo.nativeElement.style.width = 0;
        this.canvasVideo.nativeElement.style.height = 0;
        this.localCanvas.nativeElement.hidden = false;
        this.localCanvas.nativeElement.style.zoom =
          bestLayout.videoWidth / this.localCanvas.nativeElement.width;
      } else {
        this.localCanvas.nativeElement.hidden = true;
        this.canvasVideo.nativeElement.style.width = `${bestLayout.videoWidth}px`;
        this.canvasVideo.nativeElement.style.height = `${bestLayout.videoHeight}px`;
        this.canvasVideo.nativeElement.style.margin = 'auto';
      }
    }
    for (const videoElement of Object.values(this.remoteVideos)) {
      videoElement.style.width = `${bestLayout.videoWidth}px`;
      videoElement.style.height = `${bestLayout.videoHeight}px`;
    }

    // Resizing Video Button
    const buttonSize = bestLayout.videoWidth / 15;

    const buttonGroups: Array<HTMLDivElement> = [
      this.localButtonGroup?.nativeElement,
      ...Object.values(this.videoButtonGroups)
    ];
    for (const buttonGroupElement of buttonGroups) {
      if (buttonGroupElement) {
        buttonGroupElement.style.width = `${bestLayout.videoWidth}px`;
        buttonGroupElement.style.height = `${bestLayout.videoHeight}px`;
        buttonGroupElement.childNodes.forEach((buttonNode: ChildNode) => {
          const buttonElement = (buttonNode as HTMLButtonElement);
          buttonElement.style.padding = '0';
          buttonElement.style.fontSize = `${buttonSize * 3 / 5}px`;
          buttonElement.style.height = `${buttonSize}px`;
          buttonElement.style.width = `${buttonSize}px`;
          buttonElement.style.borderRadius = `${buttonSize}px`;
          buttonElement.style.margin = `0 0 ${buttonSize / 3}px ${buttonSize / 2}px`;
        });
      }
    }
  }

  getMediaConstrains(memberCount: number): MediaStreamConstraints {
    return {
      video:
        memberCount <= 1 ? {frameRate: 30, width: 640, height: 480} :
        memberCount <= 2 ? {frameRate: 15, width: 640, height: 480} :
        memberCount <= 3 ? {frameRate: 12, width: 480, height: 360} :
        memberCount <= 4 ? {frameRate: 9, width: 480, height: 360} :
        memberCount <= 6 ? {frameRate: 7, width: 480, height: 360} :
        memberCount <= 9 ? {frameRate: 7, width: 320, height: 240} :
        memberCount <= 12 ? {frameRate: 6, width: 240, height: 180} :
        memberCount <= 15 ? {frameRate: 5, width: 160, height: 120} : false,
      audio: true,
    };
  }

  setMediaStatus(stream?: MediaStream, mediaType?: string, status?: boolean): void {
    if (mediaType === 'Audio') {
      stream?.getAudioTracks().forEach((track: any) => track.enabled = status);
    }

    if (mediaType === 'Video') {
      stream?.getVideoTracks().forEach((track: any) => track.enabled = status);
    }
  }

  clickLocalVideoToggle(): void {
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

  clickLocalAudioToggle(): void {
    this.isLocalAudioOn = !this.isLocalAudioOn;
    if (this.canvasStream) {
      this.setMediaStatus(this.canvasStream, 'Audio', this.isLocalAudioOn);
    }
  }

  clickRemoteVideoToggle(id: string): void {
    this.isRemoteVideoOns[id] = !this.isRemoteVideoOns[id];
    if (this.remoteStreams[id]) {
      this.setMediaStatus(this.remoteStreams[id], 'Video', this.isRemoteVideoOns[id]);
    }
  }

  clickRemoteAudioToggle(id: string): void {
    this.isRemoteAudioOns[id] = !this.isRemoteAudioOns[id];
    if (this.remoteStreams[id]) {
      this.setMediaStatus(this.remoteStreams[id], 'Audio', this.isRemoteAudioOns[id]);
    }
  }

  getVideoLength(): number {
    return Object.keys(this.remoteVideos).length + 1;
  }

  toggleFullScreen(videoGroup: HTMLElement): void {
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

  async handleClickStartScreenSharing(): Promise<void> {
    try {
      const mediaDevices: any = navigator.mediaDevices;
      this.shareStream = await mediaDevices[`getDisplayMedia`]({video: true});
      const [videoTrack] = this.shareStream?.getVideoTracks() || [];
      this.setMediaStatus(this.shareStream, 'Video', this.isLocalVideoOn);
      if (this.canvasVideo) {
        this.canvasVideo.nativeElement.srcObject = this.shareStream;
      }

      for (const id in this.peerConnections) {
        if (id) {
          const videoSender = this.peerConnections[id].getSenders().find((sender: any) => {
            return sender.track.kind === 'video';
          });
          videoSender.replaceTrack(videoTrack);
        }
      }
      videoTrack.addEventListener('ended', () => {
        this.handleClickStopScreenSharing();
      }, {once: true});
      this.isScreenSharing = true;
    } catch (error) {
      console.error(error);
    }
  }

  handleClickStopScreenSharing(): void {
    if (this.canvasVideo) {
      this.canvasVideo.nativeElement.srcObject = this.canvasStream;
    }

    const [videoTrack] = this.canvasStream?.getVideoTracks() || [];
    for (const id in this.peerConnections) {
      if (id) {
        const videoSender = this.peerConnections[id].getSenders().find((sender: any) => {
          return sender.track.kind === 'video';
        });
        videoSender.replaceTrack(videoTrack);
      }
    }
    this.isScreenSharing = false;
  }

  changeVideoCodec(peerConnection: RTCPeerConnection, mimeType: string): void {
    const transceivers = peerConnection.getTransceivers();
    transceivers.forEach((transceiver: any) => {
      const kind = transceiver.sender.track.kind;
      let sendCodecs = RTCRtpSender.getCapabilities(kind)?.codecs;
      let recvCodecs = RTCRtpReceiver.getCapabilities(kind)?.codecs;
      if (kind === 'video') {
        sendCodecs = this.preferCodec(sendCodecs, mimeType);
        recvCodecs = this.preferCodec(recvCodecs, mimeType);
        transceiver.setCodecPreferences([...sendCodecs, ...recvCodecs]);
      }
    });
    // peerConnection.onnegotiationneeded();
  }

  preferCodec(codecs?: Array<RTCRtpCodecCapability>, mimeType?: string): Array<any> {
    const otherCodecs: Array<RTCRtpCodecCapability> = [];
    const sortedCodecs: Array<RTCRtpCodecCapability> = [];
    codecs?.forEach(codec => {
      if (codec.mimeType === mimeType) {
        sortedCodecs.push(codec);
      } else {
        otherCodecs.push(codec);
      }
    });
    return sortedCodecs.concat(otherCodecs);
  }


  drawContext(videoTag?: ElementRef, canvasTag?: ElementRef): void {
    if (!videoTag?.nativeElement || !canvasTag?.nativeElement) {
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

  /*---
  // ----- use socket.io ---
  let port = 3002;
  let socket = io.connect('http://localhost:' + port + '/');
    let room = this.getRoomName();
  socket.on('connect', function(evt) {
    // tslint:disable-next-line: no-console
    console.log('socket.io connected. enter room=' + room );
    socket.emit('enter', room);
  });
  socket.on('message', function(message) {
    // tslint:disable-next-line: no-console
    console.log('message:', message);
    let fromId = message.from;

    if (message.type === 'offer') {
      // -- got offer ---
      // tslint:disable-next-line: no-console
      console.log('Received offer ...');
      //let offer = message.sessionDescription;
      let offer = new RTCSessionDescription(message);
      this.setOffer(fromId, offer);
    }
    else if (message.type === 'answer') {
      // --- got answer ---
      // tslint:disable-next-line: no-console
      console.log('Received answer ...');
      //let answer = message.sessionDescription;
      let answer = new RTCSessionDescription(message);
      this.setAnswer(fromId, answer);
    }
    else if (message.type === 'candidate') {
      // --- got ICE candidate ---
      // tslint:disable-next-line: no-console
      console.log('Received ICE candidate ...');
      let candidate = new RTCIceCandidate(message.ice);
      // tslint:disable-next-line: no-console
      console.log(candidate);
      this.addIceCandidate(fromId, candidate);
    }
    else if (message.type === 'call me') {
      if (! this.isReadyToConnect()) {
        // tslint:disable-next-line: no-console
        console.log('Not ready to connect, so ignore');
        return;
      }
      else if (! this.canConnectMore()) {
        console.warn('TOO MANY connections, so ignore');
      }

      if (this.isConnectedWith(fromId)) {
        // already connnected, so skip
        // tslint:disable-next-line: no-console
        console.log('already connected, so ignore');
      }
      else {
        // connect new party
        this.makeOffer(fromId);
      }
    }
    else if (message.type === 'bye') {
      if (this.isConnectedWith(fromId)) {
        this.stopConnection(fromId);
      }
    }
  });
  socket.on('user disconnected', function(evt) {
    // tslint:disable-next-line: no-console
    console.log('====user disconnected==== evt:', evt);
    let id = evt.id;
    if (this.isConnectedWith(id)) {
      this.stopConnection(id);
    }
  });
  ---*/

  // ----- use firebase.io ----

  _assert(desc: string, v: any): void {
    if (v) {
      return;
    }
    else {
      // const caller = this._assert.caller || 'Top level';
      console.error('ASSERT in %s, %s is :', desc, v);
    }
  }

  async joinRoom(roomId: string): Promise<void> {
    return new Promise((resolve) => {
      // tslint:disable-next-line: no-console
      console.log('join roomId = ' + roomId);
      const key = this.database.list(this.databaseRoot + roomId + '/_join_')
      .push({ joined : 'unknown'}).key;
      this.clientId = 'member_' + key;
      // tslint:disable-next-line: no-console
      console.log('joined to roomId=' + roomId + ' as this.clientId=' + this.clientId);
      this.database.object(this.databaseRoot + roomId + '/_join_/' + key)
      .update({ joined : this.clientId});

      // remove join object
      if (!this.dataDebugFlag) {
        const jooinRef =  this.database.object(this.databaseRoot + roomId + '/_join_/' + key);
        jooinRef.remove();
      }

      this.roomBroadcastRef = this.database.list(this.databaseRoot + roomId + '/_broadcast_');
      this.roomBroadcastRef.stateChanges(['child_added']).forEach((data) => {
        // tslint:disable-next-line: no-console
        // console.log('roomBroadcastRef.on(data) data.key=' + data.key + ', data.val():', data.payload.val());
        const message = data.payload.val();
        const fromId = message.from;
        if (fromId === this.clientId) {
          // ignore self message
          return;
        }

        if (message.type === 'call me') {
          if (! this.isReadyToConnect()) {
            // tslint:disable-next-line: no-console
            console.log('Not ready to connect, so ignore');
            return;
          }
          else if (! this.canConnectMore()) {
            console.warn('TOO MANY connections, so ignore');
          }

          if (this.isConnectedWith(fromId)) {
            // already connnected, so skip
            // tslint:disable-next-line: no-console
            console.log('already connected, so ignore');
          }
          else {
            // connect new party
            this.makeOffer(fromId);
          }
        }
        else if (message.type === 'bye') {
          if (this.isConnectedWith(fromId)) {
            this.stopConnection(fromId);
          }
        }
      });

      this.clientRef = this.database.list(this.databaseRoot + roomId + '/_direct_/' + this.clientId);
      this.database.database.ref(this.databaseRoot + roomId + '/_direct_/' + this.clientId).onDisconnect().remove();
      this.clientRef.stateChanges(['child_added']).forEach((data) => {
        // tslint:disable-next-line: no-console
        console.log('clientRef.on(data)  data.key=' + data.key + ', data.val():', data.payload.val());
        const message = data.payload.val();
        const fromId = message.from;

        if (message.type === 'offer') {
          // -- got offer ---
          // let offer = message.sessionDescription;
          const offer: any = new RTCSessionDescription(message);
          // tslint:disable-next-line: no-console
          console.log('Received offer ... fromId=' + fromId, offer);
          this.setOffer(fromId, offer);
        }
        else if (message.type === 'answer') {
          // --- got answer ---
          // tslint:disable-next-line: no-console
          console.log('Received answer ... fromId=' + fromId);
          // const answer = message.sessionDescription;
          const answer = new RTCSessionDescription(message);
          this.setAnswer(fromId, answer);
        }
        else if (message.type === 'candidate') {
          // --- got ICE candidate ---
          // tslint:disable-next-line: no-console
          console.log('Received ICE candidate ... fromId=' + fromId);
          // const candidate = new RTCIceCandidate(message.ice);
          const candidate: any = new RTCIceCandidate(JSON.parse(message.ice)); // <---- JSON
          // tslint:disable-next-line: no-console
          console.log(message.ice);
          this.addIceCandidate(fromId, candidate);
        }

        if (!this.dataDebugFlag) {
          // remove direct message
          const messageRef =  this.database.object(this.databaseRoot + roomId + '/_direct_/' + this.clientId + '/' + data.key);
          messageRef.remove();
        }
      });
      resolve();
    });
  }

  // ----- use firebase.io ---- //


  // --- broadcast message to all members in room
  emitRoom(msg: any): void {
    // socket.emit('message', msg);
    msg.from = this.clientId;
    if (!this.broadcastIdRef) {
      this.roomBroadcastRef?.push(msg).then((ref) => {
        ref.onDisconnect().remove();
        this.broadcastIdRef = ref;
      });
    }
  }

  emitTo(id: string, msg: any): void {
    // msg.sendto = id;
    // socket.emit('message', msg);

    // tslint:disable-next-line: no-console
    // console.log('===== sending from=' + this.clientId + ' ,  to=' + id);
    msg.from = this.clientId;
    if (this.databaseRoot && this.roomId) {
      this.database.list(this.databaseRoot + this.roomId + '/_direct_/' + id).push(msg);
    }
  }

  clearMessage(): void {
    this.clientRef?.remove();
    this.broadcastIdRef?.remove();
  }

  // -- room名を取得 --
  getRoomName(): string { // たとえば、 URLに  ?roomname  とする
    return this.getUniqueStr();
  }

  // http://qiita.com/coa00@github/items/679b0b5c7c468698d53f
  // 疑似ユニークIDを生成
  getUniqueStr(myStrong?: number): string {
    let strong = 1000;
    if (myStrong) { strong = myStrong; }
    return new Date().getTime().toString(16)  + Math.floor(strong * Math.random()).toString(16);
  }


  // ---- for multi party -----
  isReadyToConnect(): boolean {
    if (this.localStream) {
      return true;
    }
    else {
      return false;
    }
  }

  // --- RTCPeerConnections ---
  getConnectionCount(): number {
    return Object.keys(this.peerConnections).length;
  }

  canConnectMore(): boolean {
    return (this.getConnectionCount() < this.MAX_CONNECTION_COUNT);
  }

  isConnectedWith(id: string): boolean {
    if (this.peerConnections[id])  {
      return true;
    }
    else {
      return false;
    }
  }

  addConnection(id: string, peer: RTCPeerConnection): void {
    this._assert('this.addConnection() peer', peer);
    this._assert('this.addConnection() peer must NOT EXIST', (! this.peerConnections[id]));
    this.peerConnections[id] = peer;
  }

  getConnection(id: string): RTCPeerConnection {
    const peer = this.peerConnections[id];
    this._assert('this.getConnection() peer must exist', peer);
    return peer;
  }

  deleteConnection(id: string): void {
    this._assert('this.deleteConnection() peer must exist', this.peerConnections[id]);
    delete this.peerConnections[id];
  }

  stopConnection(id: string): void {
    this.detachVideo(id);

    if (this.isConnectedWith(id)) {
      const peer = this.getConnection(id);
      peer.close();
      this.deleteConnection(id);
    }
  }

  stopAllConnection(): void {
    for (const id in this.peerConnections) {
      if (id) {
        this.stopConnection(id);
      }
    }
  }

  // --- remote streams ---
  addRemoteStream(id: string, stream: MediaStream): void {
    this._assert('addRemoteStream() stream must NOT EXIST', (! this.remoteStreams[id]));
    this.remoteStreams[id] = stream;
    if (this.isRecording && this.destinationForRecord) {
      const remoteAudioSource = this.audioContextForRecord?.createMediaStreamSource(this.remoteStreams[id]);
      remoteAudioSource?.connect(this.destinationForRecord);
      this.audioSourcesForRecording[id] = remoteAudioSource;
    }
  }

  getRemoteStream(id: string): void {
    const stream = this.remoteStreams[id];
    this._assert('getRemoteStream() stream must exist', stream);
    return stream;
  }

  deleteRemoteStream(id: string): void {
    const ID_SPLITER = ':';
    for (const key in this.remoteStreams) {
      if (key) {
        // tslint:disable-next-line: no-console
        console.log('concatId=' + id);
        const ids = key.split(ID_SPLITER);
        const peerId = ids[0];
        const streamId = ids[1];
        if (peerId === id) {
          this.audioSourcesForRecording[id].disconnect(this.remoteStreams[id]);
          delete this.remoteStreams[id];
          delete this.audioSourcesForRecording[id];
        }
      }
    }
  }

  isRemoteStreamExist(id: string, stream: MediaStream): boolean {
    const ID_SPLITER = ':';
    const concatId = id + ID_SPLITER + stream.id;
    for (const key in this.remoteStreams) {
      if (key === concatId) {
        // tslint:disable-next-line: no-console
        console.log('isRemoteStreamExist key=' + key);
        return true;
      }
    }

    return false;
  }

  // --- video elements ---
  attachVideo(id: string, stream: MediaStream): void {
    const video = this.addRemoteVideoElement(id);
    this.addRemoteStream(id, stream);
    this.playVideo(video, stream);
    video.volume = 1.0;
  }

  detachVideo(id: string): void {
    const video = this.getRemoteVideoElement(id);
    if (!video) {
      return;
    }
    this.pauseVideo(video);
    this.deleteRemoteVideoWraperElement(id);
  }

  isRemoteVideoAttached(id: string): boolean {
    if (this.remoteVideos[id]) {
      return true;
    }
    else {
      return false;
    }
  }

  addRemoteVideoElement(id: string): HTMLVideoElement {
    this._assert('this.addRemoteVideoElement() video must NOT EXIST', (! this.remoteVideos[id]));
    const {video, videoWraper, buttonGroup} = this.createVideoWraperElement(id);
    this.remoteVideos[id] = video;
    this.videoWrapers[id] = videoWraper;
    this.videoButtonGroups[id] = buttonGroup;
    this.isRemoteVideoOns[id] = true;
    this.isRemoteAudioOns[id] = true;
    this.isShowingRemoteControl[id] = false;
    this.updateVideoState(this.getVideoLength());
    return video;
  }

  getRemoteVideoElement(id: string): HTMLVideoElement {
    const video = this.remoteVideos[id];
    this._assert('this.getRemoteVideoElement() video must exist', video);
    return video;
  }

  deleteRemoteVideoWraperElement(id: string): void {
    this._assert('this.deleteRemoteVideoWraperElement() stream must exist', this.remoteVideos[id]);
    this.removeVideoWraperElement(id);
    delete this.remoteVideos[id];
    delete this.videoWrapers[id];
    delete this.isRemoteVideoOns[id];
    delete this.isRemoteAudioOns[id];
    delete this.isShowingRemoteControl[id];
    this.updateVideoState(this.getVideoLength());
  }

  createVideoWraperElement(id: string)
  : {
    video: HTMLVideoElement,
    videoWraper: HTMLDivElement,
    buttonGroup: HTMLDivElement,
  } {
    const videoWraper: HTMLDivElement = document.createElement('div');
    videoWraper.style.lineHeight = '0';
    videoWraper.style.margin = 'auto';
    videoWraper.id = 'video_wraper_' + id;
    const video: HTMLVideoElement = document.createElement('video');
    video.id = 'remote_video_' + id;
    const buttonGroup: HTMLDivElement = document.createElement('div');
    buttonGroup.style.zIndex = '2';
    buttonGroup.style.display = 'flex';
    buttonGroup.style.position = 'fixed';
    const videoToggleButton: HTMLButtonElement = document.createElement('button');
    videoToggleButton.className = 'btn fa mt-auto btn-danger fa-eye-slash';
    videoToggleButton.style.opacity = '0.2';
    videoToggleButton.onclick = () => {
      this.clickRemoteVideoToggle(id);
      videoToggleButton.className = `btn fa mt-auto ${
        this.isRemoteVideoOns[id] ? 'btn-danger fa-eye-slash' : 'btn-secondary fa-eye'
      }`;
    };
    videoToggleButton.onmouseenter = () => {
      videoToggleButton.style.opacity = '0.7';
    };
    videoToggleButton.onmouseleave = () => {
      videoToggleButton.style.opacity = '0.2';
    };

    const audioToggleButton: HTMLButtonElement = document.createElement('button');
    audioToggleButton.className = 'btn video-button fa mt-auto btn-danger fa-microphone-slash';
    audioToggleButton.style.opacity = '0.2';
    audioToggleButton.onclick = () => {
      this.clickRemoteAudioToggle(id);
      audioToggleButton.className = `btn video-button fa mt-auto ${
        this.isRemoteAudioOns[id] ? 'btn-danger fa-microphone-slash' : 'btn-secondary fa-microphone'
      }`;
    };
    audioToggleButton.onmouseenter = () => {
      audioToggleButton.style.opacity = '0.7';
    };
    audioToggleButton.onmouseleave = () => {
      audioToggleButton.style.opacity = '0.2';
    };

    const fullscreenToggleButton: HTMLButtonElement = document.createElement('button');
    fullscreenToggleButton.className = 'btn btn-secondary video-button fa fa-expand mt-auto';
    fullscreenToggleButton.style.opacity = '0.2';
    fullscreenToggleButton.onclick = () => {
      this.toggleFullScreen(videoWraper);
      fullscreenToggleButton.className = `btn btn-secondary video-button fa mt-auto ${
        this.isFullScreen ? 'fa-expand' : 'fa-compress'
      }`;
      video.style.width = this.isFullScreen ? 'unset' : '100vw';
      video.style.height = this.isFullScreen ? 'unset' : '100vh';
      buttonGroup.style.width = this.isFullScreen ? 'unset' : '100vw';
      buttonGroup.style.height = this.isFullScreen ? 'unset' : '100vh';
    };
    fullscreenToggleButton.onmouseenter = () => {
      fullscreenToggleButton.style.opacity = '0.7';
    };
    fullscreenToggleButton.onmouseleave = () => {
      fullscreenToggleButton.style.opacity = '0.2';
    };


    buttonGroup.appendChild(videoToggleButton);
    buttonGroup.appendChild(audioToggleButton);
    buttonGroup.appendChild(fullscreenToggleButton);
    videoWraper.appendChild(buttonGroup);
    videoWraper.appendChild(video);
    videoWraper.onclick = () => {
      this.isShowingRemoteControl[id] = !this.isShowingRemoteControl[id];
    };
    videoWraper.onmouseenter = () => {
      this.isShowingRemoteControl[id] = true;
    };
    videoWraper.onmouseleave = () => {
      this.isShowingRemoteControl[id] = false;
    };
    this.videoContainer?.nativeElement.appendChild(videoWraper);
    return {video, videoWraper, buttonGroup };
  }

  supportsRecording(mimeType: string): boolean {
    if (!MediaRecorder) {
      return false;
    }
    return MediaRecorder.isTypeSupported(mimeType);
  }

  removeVideoWraperElement(id: string): HTMLDivElement {
    const videoWraper: HTMLDivElement = (document.getElementById('video_wraper_' + id) as HTMLDivElement);
    this._assert('removeVideoWraperElement() video must exist', videoWraper);
    this.videoContainer?.nativeElement.removeChild(videoWraper);
    return videoWraper;
  }

  async handleClickStartRecording(): Promise<void> {
    this.audioSourcesForRecording = {};
    const mediaDevices: any = navigator.mediaDevices;
    this.recordStream = await mediaDevices[`getDisplayMedia`]({video: true});
    const [videoTrack] = this.recordStream?.getVideoTracks() || [];
    this.audioContextForRecord = new AudioContext();
    this.destinationForRecord = this.audioContextForRecord.createMediaStreamDestination();
    let localAudioSource;
    if (this.canvasStream) {
      localAudioSource = this.audioContextForRecord.createMediaStreamSource(this.canvasStream);
    }
    localAudioSource?.connect(this.destinationForRecord);
    for (const id in this.remoteStreams) {
      if (id) {
        const remoteAudioSource = this.audioContextForRecord.createMediaStreamSource(this.remoteStreams[id]);
        remoteAudioSource.connect(this.destinationForRecord);
        this.audioSourcesForRecording[id] = remoteAudioSource;
      }
    }
    this.recordStream?.addTrack(this.destinationForRecord.stream.getAudioTracks()[0]);
    this.mediaRecorder = new MediaRecorder(this.recordStream, {mimeType: this.recordType});
    this.videoChunks = [];
    this.mediaRecorder.ondataavailable = (e: any) => {
      if (e.data) {
        this.videoChunks.push(e.data);
      }
    };
    this.isRecording = true;
    this.mediaRecorder.start(10);
    videoTrack.addEventListener('ended', () => {
      this.handleClickStopRecording();
    }, {once: true});
  }
  handleClickStopRecording(): void {
    this.mediaRecorder.stop();
    this.recordStream?.getTracks().map(track => track.stop());
    this.isRecording = false;
    this.isFinishedRecording = true;
  }

  async handleClickDownloadRecord(): Promise<void> {
    const ffmpeg = createFFmpeg({log: true});
    const fileBlob = new Blob(this.videoChunks, { type: this.recordType });
    const videoURL = await this.transcode(fileBlob);
    const link = document.createElement('a');
    link.href = videoURL;
    link.download = Date.now() + '_meeting.mp4';
    link.click();
    setTimeout(() => {
      document.removeChild(link);
      window.URL.revokeObjectURL(videoURL);
    }, 100);
    this.isFinishedRecording = true;
  }

  async transcode(videoChunks: Blob): Promise<string> {
    const ffmpeg = createFFmpeg({
      log: true,
    });
    const message = document.getElementById('message');
    const name = 'record.webm';
    // tslint:disable-next-line: no-console
    console.log('Loading ffmpeg-core.js');
    await ffmpeg.load();
    // tslint:disable-next-line: no-console
    console.log('Start transcoding');
    ffmpeg.FS('writeFile', name, await fetchFile(videoChunks));
    await ffmpeg.run('-y', '-i', name, '-c:v', 'copy', '-q:a', '0', 'output.mp4');
    // tslint:disable-next-line: no-console
    console.log('Complete transcoding');
    const data = ffmpeg.FS('readFile', 'output.mp4');
    return URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
  }

  // ---------------------- media handling -----------------------
  async updateVideoResolution(videoCount: number): Promise<void> {
    this.localStream = await this.getDeviceStream(this.getMediaConstrains(videoCount));
    this.playVideo(this.localVideo?.nativeElement, this.localStream);
  }

  updateVideoFrameRate(videoCount: number): void {
    const constrains = (this.getMediaConstrains(videoCount) as any);
    if (this.localCanvasInterval) {
      clearInterval(this.localCanvasInterval);
    }

    const nextFrameRate = constrains?.video?.frameRate?.ideal || constrains?.video?.frameRate;
    if (nextFrameRate) {
      this.localCanvasInterval = setInterval(this.drawContext.bind(
        this, this.localVideo, this.localCanvas
      ), 1000 / nextFrameRate);
    }
  }

  // start local video
  async updateVideoState(videoCount = 1): Promise<void> {
    const navi: any = navigator;
    this.mediaDevices = navigator.mediaDevices ||
    ((navi.mozGetUserMedia || navi.webkitGetUserMedia) ? {
      getUserMedia: (c: any) => {
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

    await this.updateVideoResolution(videoCount);
    this.updateVideoFrameRate(videoCount);
    this.onResizeWindow();

    if (/Firefox/g.test(navigator.userAgent)) {
      await new Promise<any>((resolve: any) => {
        setTimeout(async () => {
          resolve();
        }, 3000);
      });
    }

    if (!this.canvasStream && this.canvasVideo) {
      this.canvasStream = this.localCanvas?.nativeElement.captureStream();
      const [localVideoAudio] = this.localStream?.getAudioTracks() || [];
      this.canvasStream?.addTrack(localVideoAudio);
      this.canvasVideo.nativeElement.srcObject = this.canvasStream;
      this.canvasVideo.nativeElement.muted = true;
      this.canvasVideo.nativeElement.autoplay = true;
      this.canvasVideo.nativeElement.setAttribute('playsinline', '');
    }
  }

  // stop local video
  async stopVideo(): Promise<void> {
    this.pauseVideo(this.localVideo?.nativeElement);
    this.pauseVideo(this.canvasVideo?.nativeElement);
    this.stopStream(this.localStream);
    this.stopStream(this.canvasStream);
    this.stopStream(this.shareStream);
    delete this.localStream;
    delete this.canvasStream;
    delete this.shareStream;
  }

  stopStream(stream?: MediaStream): void {
    const tracks = stream?.getTracks() || [];
    if (! tracks) {
      console.warn('NO tracks');
      return;
    }
    console.log(tracks);

    for (const track of tracks) {
      track.stop();
    }
  }

  getDeviceStream(option: MediaStreamConstraints): Promise<MediaStream>|undefined {
    if ('getUserMedia' in navigator.mediaDevices) {
      // tslint:disable-next-line: no-console
      console.log('navigator.mediaDevices.getUserMadia');
      return navigator.mediaDevices.getUserMedia(option);
    }
    else if ('getUserMedia' in navigator){
      // tslint:disable-next-line: no-console
      console.log('wrap navigator.getUserMadia with Promise');
      return new Promise<MediaStream>((resolve, reject) => {
        navigator.getUserMedia(option,
          resolve,
          reject
        );
      });
    } else {
      this.isPage = false;
      return;
    }
  }

  playVideo(element: any, stream?: MediaStream): void {
    if (!element) {
      return;
    }

    if ('srcObject' in element) {
      element.srcObject = stream;
    }
    else {
      element.src = window.URL.createObjectURL(stream);
    }
    element.play();
    element.volume = 0;
  }

  pauseVideo(element: any): void {
    element.pause();
    if ('srcObject' in element) {
      element.srcObject = null;
    }
    else {
      if (element.src && (element.src !== '') ) {
        window.URL.revokeObjectURL(element.src);
      }
      element.src = '';
    }
  }

  /*--
  // ----- hand signaling ----
  function onSdpText() {
    let text = textToReceiveSdp.value;
    if (peerConnection) {
      // tslint:disable-next-line: no-console
      console.log('Received answer text...');
      let answer = new RTCSessionDescription({
        type : 'answer',
        sdp : text,
      });
      this.setAnswer(answer);
    }
    else {
      // tslint:disable-next-line: no-console
      console.log('Received offer text...');
      let offer = new RTCSessionDescription({
        type : 'offer',
        sdp : text,
      });
      this.setOffer(offer);
    }
    textToReceiveSdp.value ='';
  }
  --*/

  sendSdp(id: string, sessionDescription: RTCSessionDescription|null): void {
    // tslint:disable-next-line: no-console
    // console.log('---sending sdp ---');

    /*---
    textForSendSdp.value = sessionDescription.sdp;
    textForSendSdp.focus();
    textForSendSdp.select();
    ----*/

    const message = { type: sessionDescription?.type, sdp: sessionDescription?.sdp };
    // tslint:disable-next-line: no-console
    // console.log('sending SDP=' + message);
    // ws.send(message);
    // socket.emit('message', message);
    this.emitTo(id, message);
  }

  sendIceCandidate(id: string, candidate: RTCIceCandidate): void {
    // tslint:disable-next-line: no-console
    // console.log('---sending ICE candidate ---');
    const obj = { type: 'candidate', ice: JSON.stringify(candidate) }; // <--- JSON
    const message = JSON.stringify(obj);
    // tslint:disable-next-line: no-console
    // console.log('sending candidate=' + message);
    // ws.send(message);
    // socket.emit('message', obj);
    this.emitTo(id, obj);
  }

  // ---------------------- connection handling -----------------------
  prepareNewConnection(id: string): RTCPeerConnection {
    const peer: any = new RTCPeerConnection(this.rtcConfiguration);

    // --- on get remote stream ---
    if ('ontrack' in peer) {
      peer.ontrack = (event: any) => {
        const stream = event.streams[0];
        // tslint:disable-next-line: no-console
        console.log('-- peer.ontrack() stream.id=' + stream.id);
        if (this.isRemoteVideoAttached(id)) {
          // tslint:disable-next-line: no-console
          console.log('stream already attached, so ignore');
        }
        else {
          // this.playVideo(remoteVideo, stream);
          this.changeVideoCodec(peer, 'video/mp4');
          this.attachVideo(id, stream);
        }
      };
    }
    else {
      peer.onaddstream = (event: any) => {
        const stream = event.stream;
        // tslint:disable-next-line: no-console
        console.log('-- peer.onaddstream() stream.id=' + stream.id);
        // this.playVideo(remoteVideo, stream);
        this.changeVideoCodec(peer, 'video/mp4');
        this.attachVideo(id, stream);
      };
    }

    // --- on get local ICE candidate
    peer.onicecandidate = (event: any) => {
      if (event.candidate) {
        // tslint:disable-next-line: no-console
        // console.log(event.candidate);

        // Trickle ICE の場合は、ICE candidateを相手に送る
        this.sendIceCandidate(id, event.candidate);

        // Vanilla ICE の場合には、何もしない
      } else {
        // tslint:disable-next-line: no-console
        console.log('empty ice event');

        // Trickle ICE の場合は、何もしない

        // Vanilla ICE の場合には、ICE candidateを含んだSDPを相手に送る
        // sendSdp(id, peer.localDescription);
      }
    };

    // --- when need to exchange SDP ---
    peer.onnegotiationneeded = (event: any) => {
      // tslint:disable-next-line: no-console
      // console.log('-- onnegotiationneeded() ---');
    };

    // --- other events ----
    peer.onicecandidateerror = (event: any) => {
      console.error('ICE candidate ERROR:', event);
    };

    peer.onsignalingstatechange = () => {
      // tslint:disable-next-line: no-console
      console.log('== signaling status=' + peer.signalingState);
    };

    peer.oniceconnectionstatechange = () => {
      // tslint:disable-next-line: no-console
      console.log('== ice connection status=' + peer.iceConnectionState);
      if (peer.iceConnectionState === 'disconnected') {
        // tslint:disable-next-line: no-console
        console.log('-- disconnected --');
        // hangUp();
        this.stopConnection(id);
      }
    };

    peer.onicegatheringstatechange = () => {
      // tslint:disable-next-line: no-console
      console.log('==***== ice gathering state=' + peer.iceGatheringState);
    };

    peer.onconnectionstatechange = () => {
      // tslint:disable-next-line: no-console
      console.log('==***== connection state=' + peer.connectionState);
    };

    peer.onremovestream = () => {
      // tslint:disable-next-line: no-console
      console.log('-- peer.onremovestream()');
      // this.pauseVideo(remoteVideo);
      this.deleteRemoteStream(id);
      this.detachVideo(id);
    };

    // -- add local stream --
    if (this.canvasStream) {
      // tslint:disable-next-line: no-console
      console.log('Adding local stream...');
      peer.addStream(this.canvasStream);
    }
    else {
      console.warn('no local stream, but continue.');
    }

    return peer;
  }

  makeOffer(id: string): void {
    this._assert('this.makeOffer must not connected yet', (! this.isConnectedWith(id)) );
    const peerConnection = this.prepareNewConnection(id);
    this.addConnection(id, peerConnection);

    peerConnection.createOffer()
    .then((sessionDescription) => {
      // tslint:disable-next-line: no-console
      console.log('createOffer() succsess in promise');
      return peerConnection.setLocalDescription(sessionDescription);
    }).then(() => {
      // tslint:disable-next-line: no-console
      console.log('setLocalDescription() succsess in promise');

      // -- Trickle ICE の場合は、初期SDPを相手に送る --
      this.sendSdp(id, peerConnection?.localDescription);

      // -- Vanilla ICE の場合には、まだSDPは送らない --
    }).catch((err) => {
      // console.error(err);
    });
  }

  setOffer(id: string, sessionDescription: RTCSessionDescription): void {
    /*
    if (peerConnection) {
      console.error('peerConnection alreay exist!');
    }
    */
    this._assert('this.setOffer must not connected yet', (! this.isConnectedWith(id)) );
    const peerConnection = this.prepareNewConnection(id);
    this.addConnection(id, peerConnection);

    peerConnection.setRemoteDescription(sessionDescription)
    .then(() => {
      // tslint:disable-next-line: no-console
      // console.log('setRemoteDescription(offer) succsess in promise');
      this.makeAnswer(id);
    }).catch((err) => {
      console.error('setRemoteDescription(offer) ERROR: ', err);
    });
  }

  makeAnswer(id: string): void {
    // tslint:disable-next-line: no-console
    console.log('sending Answer. Creating remote session description...' );
    const peerConnection = this.getConnection(id);
    if (! peerConnection) {
      console.error('peerConnection NOT exist!');
      return;
    }

    peerConnection.createAnswer()
    .then((sessionDescription) => {
      // tslint:disable-next-line: no-console
      console.log('createAnswer() succsess in promise');
      return peerConnection.setLocalDescription(sessionDescription);
    }).then(() => {
      // tslint:disable-next-line: no-console
      console.log('setLocalDescription() succsess in promise');

      // -- Trickle ICE の場合は、初期SDPを相手に送る --
      this.sendSdp(id, peerConnection.localDescription);

      // -- Vanilla ICE の場合には、まだSDPは送らない --
    }).catch((err) => {
      console.error(err);
    });
  }

  setAnswer(id: string, sessionDescription: RTCSessionDescription): void {
    const peerConnection = this.getConnection(id);
    if (! peerConnection) {
      console.error('peerConnection NOT exist!');
      return;
    }

    peerConnection.setRemoteDescription(sessionDescription)
    .then(() => {
      // tslint:disable-next-line: no-console
      console.log('setRemoteDescription(answer) succsess in promise');
    }).catch((err) => {
      console.error('setRemoteDescription(answer) ERROR: ', err);
    });
  }

  // --- tricke ICE ---
  addIceCandidate(id: string, candidate: RTCIceCandidate): void {
    const peerConnection = this.getConnection(id);
    if (peerConnection) {
      peerConnection.addIceCandidate(candidate);
    }
    else {
      console.error('PeerConnection not exist!');
      return;
    }
  }

  // start PeerConnection
  connect(): void {
    /*
    debugger; // SHOULD NOT COME HERE

    if (! peerConnection) {
      // tslint:disable-next-line: no-console
      console.log('make Offer');
      this.makeOffer();
    }
    else {
      console.warn('peer already exist.');
    }
    */

    if (! this.isReadyToConnect()) {
      console.warn('NOT READY to connect');
    }
    else if (! this.canConnectMore()) {
      // tslint:disable-next-line: no-console
      console.log('TOO MANY connections');
    }
    else {
      this.callMe();
    }
  }

  // close PeerConnection
  async hangUp(): Promise<void> {
    // this.emitRoom({ type: 'bye' });
    this.clearMessage(); // clear firebase
    this.stopAllConnection();
  }

  // ---- multi party --
  callMe(): void {
    this.emitRoom({type: 'call me'});
  }

  ngOnInit(): void {
  }

  async ngOnDestroy(): Promise<void> {
    window.removeEventListener('resize', this.onResizeWindow);
    if (this.localCanvasInterval) {
      clearInterval(this.localCanvasInterval);
    }

    await this.hangUp();
    await this.stopVideo();
  }
}
