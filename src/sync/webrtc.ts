// WebRTC Peer-to-Peer Sync

import { createBackup, type BackupData } from './backup';

export type SyncRole = 'host' | 'guest';
export type SyncState = 'idle' | 'waiting' | 'connecting' | 'syncing' | 'done' | 'error';

export interface SyncSession {
  role: SyncRole;
  state: SyncState;
  peer: RTCPeerConnection | null;
  channel: RTCDataChannel | null;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export function createPeerConnection(): RTCPeerConnection {
  return new RTCPeerConnection(ICE_SERVERS);
}

// Host: Erstellt ein Angebot (Offer) als JSON-String für QR-Code
export async function createOffer(): Promise<{
  pc: RTCPeerConnection;
  offer: string;
  onAnswer: (answer: string) => Promise<void>;
  onData: () => Promise<BackupData>;
}> {
  const pc = createPeerConnection();
  const channel = pc.createDataChannel('sync', { ordered: true });

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  // Warte auf ICE-Kandidaten
  await new Promise<void>((resolve) => {
    pc.onicecandidate = (e) => {
      if (!e.candidate) resolve();
    };
    // Timeout nach 3 Sekunden
    setTimeout(resolve, 3000);
  });

  const offerStr = JSON.stringify(pc.localDescription);

  return {
    pc,
    offer: offerStr,
    onAnswer: async (answerStr: string) => {
      const answer = JSON.parse(answerStr);
      await pc.setRemoteDescription(answer);
    },
    onData: () =>
      new Promise((resolve, reject) => {
        const chunks: string[] = [];
        channel.onmessage = (e) => {
          if (e.data === '__DONE__') {
            try {
              resolve(JSON.parse(chunks.join('')));
            } catch (err) {
              reject(err);
            }
          } else {
            chunks.push(e.data);
          }
        };
        channel.onerror = () => reject(new Error('DataChannel Fehler'));
      }),
  };
}

// Guest: Nimmt Angebot an und sendet Daten
export async function acceptOffer(offerStr: string): Promise<{
  pc: RTCPeerConnection;
  answer: string;
  sendData: () => Promise<void>;
}> {
  const pc = createPeerConnection();
  const offer = JSON.parse(offerStr);
  await pc.setRemoteDescription(offer);

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  // Warte auf ICE
  await new Promise<void>((resolve) => {
    pc.onicecandidate = (e) => {
      if (!e.candidate) resolve();
    };
    setTimeout(resolve, 3000);
  });

  const answerStr = JSON.stringify(pc.localDescription);

  return {
    pc,
    answer: answerStr,
    sendData: async () => {
      return new Promise<void>((resolve, reject) => {
        pc.ondatachannel = (e) => {
          const channel = e.channel;
          channel.onopen = async () => {
            try {
              const backup = await createBackup();
              const json = JSON.stringify(backup);

              // In Chunks senden (WebRTC DataChannel hat Größenlimit)
              const CHUNK_SIZE = 16384;
              for (let i = 0; i < json.length; i += CHUNK_SIZE) {
                channel.send(json.slice(i, i + CHUNK_SIZE));
              }
              channel.send('__DONE__');
              resolve();
            } catch (err) {
              reject(err);
            }
          };
        };
      });
    },
  };
}
