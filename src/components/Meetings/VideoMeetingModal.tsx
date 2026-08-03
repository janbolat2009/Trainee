import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, CameraOff, Mic, MicOff, MonitorUp, PhoneOff, Loader2, Wifi, WifiOff, Users } from 'lucide-react';
import type { ConsultationBooking } from '../../types';
import { useApp } from '../../context/AppContext';
import { createSignalingChannel, type SignalMessage, type SignalingChannel } from '../../services/signalingService';

interface VideoMeetingModalProps {
  booking: ConsultationBooking | null;
  onClose: () => void;
}

type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export const VideoMeetingModal: React.FC<VideoMeetingModalProps> = ({ booking, onClose }) => {
  const { currentProfile } = useApp();
  const userId = currentProfile?.profile.id ?? null;

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const signalingRef = useRef<SignalingChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Perfect-negotiation bookkeeping (avoids offer/answer collisions).
  const politeRef = useRef(false);
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const isSettingRemoteAnswerPendingRef = useRef(false);

  useEffect(() => {
    if (!booking || !userId) return undefined;

    let isMounted = true;

    // The participant with the lexicographically smaller id is "polite":
    // they back off instead of racing when both sides send an offer at once.
    politeRef.current = userId < (booking.coachId === userId ? booking.athleteId : booking.coachId);

    console.log('[WebRTC] Starting meeting session', { meetingId: booking.id, userId, polite: politeRef.current });

    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Your browser does not support camera and microphone access.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        console.log('[WebRTC] Local media acquired', {
          audioTracks: stream.getAudioTracks().length,
          videoTracks: stream.getVideoTracks().length,
        });

        streamRef.current = stream;
        setPermissionError(null);
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        peerConnectionRef.current = pc;

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        pc.ontrack = (event) => {
          console.log('[WebRTC] Remote track received', event.track.kind);
          const [remote] = event.streams;
          if (remote) {
            setRemoteStream(remote);
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remote;
            remote.getTracks().forEach((track) => {
              track.addEventListener('ended', () => {
                console.log('[WebRTC] Remote track ended', track.kind);
                setRemoteStream(null);
              });
            });
          }
        };

        pc.oniceconnectionstatechange = () => {
          console.log('[WebRTC] ICE connection state:', pc.iceConnectionState);
          if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
            setConnectionState('connected');
            setIsLoading(false);
          } else if (pc.iceConnectionState === 'checking') {
            setConnectionState('connecting');
          } else if (pc.iceConnectionState === 'disconnected') {
            setConnectionState('reconnecting');
          } else if (pc.iceConnectionState === 'failed') {
            console.warn('[WebRTC] ICE connection failed, attempting restart');
            setConnectionState('reconnecting');
            void pc.restartIce();
          }
        };

        pc.onconnectionstatechange = () => {
          console.log('[WebRTC] Peer connection state:', pc.connectionState);
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            signalingRef.current?.send({ type: 'candidate', candidate: event.candidate.toJSON() });
          }
        };

        // Perfect negotiation: automatically (re)negotiate whenever tracks change.
        pc.onnegotiationneeded = async () => {
          try {
            makingOfferRef.current = true;
            const offer = await pc.createOffer();
            if (pc.signalingState !== 'stable') return;
            await pc.setLocalDescription(offer);
            console.log('[WebRTC] Sending offer');
            signalingRef.current?.send({ type: 'offer', offer: pc.localDescription!.toJSON() });
          } catch (error) {
            console.error('[WebRTC] Negotiation error', error);
          } finally {
            makingOfferRef.current = false;
          }
        };

        const signaling = createSignalingChannel(booking.id, userId, async (message: SignalMessage) => {
          try {
            if (message.type === 'join') {
              // A late joiner announces itself; if we already have local media, renegotiate.
              return;
            }

            if (message.type === 'offer' && message.offer) {
              const offerCollision =
                message.offer.type === 'offer' &&
                (makingOfferRef.current || pc.signalingState !== 'stable');

              ignoreOfferRef.current = !politeRef.current && offerCollision;
              if (ignoreOfferRef.current) {
                console.log('[WebRTC] Ignoring colliding offer (impolite peer)');
                return;
              }

              if (offerCollision) {
                await Promise.all([
                  pc.setLocalDescription({ type: 'rollback' }),
                  pc.setRemoteDescription(new RTCSessionDescription(message.offer)),
                ]);
              } else {
                await pc.setRemoteDescription(new RTCSessionDescription(message.offer));
              }

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              console.log('[WebRTC] Sending answer');
              signalingRef.current?.send({ type: 'answer', answer: pc.localDescription!.toJSON() });
            } else if (message.type === 'answer' && message.answer) {
              if (pc.signalingState === 'have-local-offer') {
                isSettingRemoteAnswerPendingRef.current = true;
                await pc.setRemoteDescription(new RTCSessionDescription(message.answer));
                isSettingRemoteAnswerPendingRef.current = false;
                console.log('[WebRTC] Remote answer applied');
              }
            } else if (message.type === 'candidate' && message.candidate) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
              } catch (error) {
                if (!ignoreOfferRef.current) {
                  console.error('[WebRTC] Failed to add ICE candidate', error);
                }
              }
            } else if (message.type === 'leave') {
              console.log('[WebRTC] Remote participant left');
              setConnectionState('disconnected');
              setRemoteStream(null);
            }
          } catch (error) {
            console.error('[WebRTC] Signal handling error', error);
            setConnectionState('reconnecting');
          }
        });

        signalingRef.current = signaling;
        signaling?.send({ type: 'join' });
      } catch (error) {
        console.error('[WebRTC] Failed to start session', error);
        setIsLoading(false);
        setPermissionError(error instanceof Error ? error.message : 'Unable to access camera or microphone.');
        setConnectionState('disconnected');
      }
    };

    void start();

    const interval = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
      signalingRef.current?.send({ type: 'leave' });
      signalingRef.current?.cleanup();
      signalingRef.current = null;
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setLocalStream(null);
      setRemoteStream(null);
    };
  }, [booking?.id, userId]);

  const participantLabel = useMemo(() => {
    if (!booking) return 'Meeting';
    return `${booking.athleteName} • Coach`;
  }, [booking]);

  const toggleMic = () => {
    const tracks = localStream?.getAudioTracks() ?? [];
    tracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsMicMuted((value) => !value);
  };

  const toggleCamera = () => {
    const tracks = localStream?.getVideoTracks() ?? [];
    tracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsCameraOff((value) => !value);
  };

  const toggleScreenShare = async () => {
    if (!localStream || !peerConnectionRef.current) return;
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = peerConnectionRef.current.getSenders().find((entry) => entry.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(screenTrack);
      }
      setIsScreenSharing(true);
      screenTrack.addEventListener('ended', () => {
        setIsScreenSharing(false);
        const cameraTrack = streamRef.current?.getVideoTracks()[0];
        if (cameraTrack && sender) {
          void sender.replaceTrack(cameraTrack);
        }
      }, { once: true });
      const currentTrack = localStream.getVideoTracks()[0];
      if (currentTrack && currentTrack !== screenTrack) currentTrack.stop();
      setLocalStream((prev) => (prev ? new MediaStream([screenTrack, ...(prev.getAudioTracks() ?? [])]) : null));
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = new MediaStream([screenTrack]);
      }
    } catch (error) {
      console.error('[WebRTC] Screen share failed', error);
    }
  };

  const leaveMeeting = () => {
    signalingRef.current?.send({ type: 'leave' });
    onClose();
  };

  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/85 p-3 py-4 backdrop-blur-md sm:py-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-[#0b0f17] shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-brand-accent">Secure meeting room</p>
            <h2 className="mt-1 text-xl font-semibold text-white">{participantLabel}</h2>
            <p className="mt-1 text-sm text-zinc-400">A built-in WebRTC session for performance reviews, technical feedback, and consultation prep.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-brand-border bg-brand-dark/80 px-3 py-2 text-xs text-zinc-300">
            {connectionState === 'connected' ? <Wifi className="h-4 w-4 text-emerald-400" /> : <WifiOff className="h-4 w-4 text-amber-400" />}
            <span className="capitalize">{connectionState}</span>
          </div>
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-brand-dark">
            <video ref={remoteVideoRef} autoPlay playsInline className="h-[420px] w-full object-cover" />
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-dark to-[#080a10]">
                <div className="text-center">
                  {isLoading ? (
                    <div className="mb-3 flex justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-brand-accent" />
                    </div>
                  ) : (
                    <Users className="mx-auto mb-3 h-8 w-8 text-brand-accent" />
                  )}
                  <p className="text-sm text-zinc-300">{isLoading ? 'Connecting to the session...' : 'Waiting for the other participant to join.'}</p>
                  {permissionError && <p className="mt-2 text-xs text-amber-400">{permissionError}</p>}
                </div>
              </div>
            )}
            <div className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-black/45 px-3 py-2 text-xs text-zinc-200">
              {formatDuration(elapsedSeconds)} • {booking.format === 'online' ? 'Video call' : 'Consultation'}
            </div>
            <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/45 px-3 py-2 text-xs text-zinc-200">
              {booking.athleteName}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[24px] border border-white/10 bg-brand-dark p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-brand-muted">Local preview</p>
                  <p className="mt-1 text-sm font-semibold text-white">Your camera and microphone</p>
                </div>
                <div className="rounded-full border border-brand-accent/25 bg-brand-accent/10 px-2.5 py-1 text-[10px] font-semibold text-brand-accent">
                  Ready
                </div>
              </div>
              <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black/70">
                <video ref={localVideoRef} autoPlay playsInline muted className="h-48 w-full object-cover" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={toggleMic} className="rounded-2xl border border-brand-border bg-brand-dark/70 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10">
                {isMicMuted ? <MicOff className="mr-2 inline h-4 w-4" /> : <Mic className="mr-2 inline h-4 w-4" />}
                {isMicMuted ? 'Unmute mic' : 'Mute mic'}
              </button>
              <button onClick={toggleCamera} className="rounded-2xl border border-brand-border bg-brand-dark/70 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10">
                {isCameraOff ? <CameraOff className="mr-2 inline h-4 w-4" /> : <Camera className="mr-2 inline h-4 w-4" />}
                {isCameraOff ? 'Turn camera on' : 'Turn camera off'}
              </button>
              <button onClick={toggleScreenShare} disabled={isScreenSharing} className="rounded-2xl border border-brand-border bg-brand-dark/70 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50">
                <MonitorUp className="mr-2 inline h-4 w-4" />
                {isScreenSharing ? 'Sharing…' : 'Share screen'}
              </button>
              <button onClick={leaveMeeting} className="rounded-2xl border border-rose-500/30 bg-rose-500/12 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/22">
                <PhoneOff className="mr-2 inline h-4 w-4" />
                Leave
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};