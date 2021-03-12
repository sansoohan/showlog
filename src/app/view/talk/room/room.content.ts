export class RoomContent {
  id?: string;
  ownerId?: string;
  userName?: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  createdAt?: number;
}
