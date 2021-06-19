import { useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import { setAccessToken } from "../accessToken";
import { BroadcastersDocument, BroadcastersQuery, useBroadcastersQuery, useLogoutMutation, useSaveBroadcasterMutation } from "../generated/graphql";

interface props {
    id: number,
    email: string
}

interface payload {
    sdp: RTCSessionDescription|null,
    userId: number,
    broadcasterId: Number|null
}

function Dashboard({id, email}: props) {
    const history = useHistory();
    const broadcasterVideo = useRef<HTMLVideoElement>(null);
    const collaboratorVideo = useRef<HTMLVideoElement>(null);
    const [logout] = useLogoutMutation();
    const [isBroadcaster, setIsBroadcaster] = useState(false);
    const [isCollaborator, setIsCollaborator] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const {data, loading, error} = useBroadcastersQuery();
    
    const broadcastStream = async () => {
        setIsBroadcaster(true);
        // get broadcaster video
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (broadcasterVideo.current) {
            broadcasterVideo.current.srcObject = stream;
        }
        const peer = createPeer("broadcast", id);
        stream.getTracks().forEach(track => peer.addTrack(track, stream));
    }

    const viewStream = async (userId: Number) => {
        const peer = createPeer("consumer", userId);
        peer.addTransceiver("video", { direction: "sendrecv" });
    }

    const collabStream = async (userId: Number) => {
        setIsCollaborator(true);
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (collaboratorVideo.current) {
            collaboratorVideo.current.srcObject = stream;
        }
        const peer = createPeer("collaborator", userId);
        stream.getTracks().forEach(track => peer.addTrack(track, stream));
   
    }

    let body = null;
    if (loading) {
        body = <div>Loading...</div>;
    } else if (error) {
        console.log(error);
        body = <div>Oops!!Something went wrong</div>;
    } else if (data && data.broadcasters) {
        body = <div>
                {!isBroadcaster && !isStreaming && !isCollaborator &&
                    data.broadcasters.map(broadcaster => {
                        return <div key={broadcaster.id}>
                                <button key={`view${broadcaster.id}`} onClick={() => viewStream(broadcaster.userid)} >Join {broadcaster.email}'s stream</button>
                                <button key={`collab${broadcaster.id}`} onClick={() => collabStream(broadcaster.userid)}>Join {broadcaster.email}'s stream as a collab</button>
                            </div>
                    })
                }
                broadcaster: <video autoPlay ref={broadcasterVideo} />
                collaborator: <video autoPlay ref={collaboratorVideo} />
                {!isBroadcaster && !isStreaming && !isCollaborator && <button onClick={broadcastStream}>Broadcast</button>}
            </div>;
    }

    const [saveBroadcaster] = useSaveBroadcasterMutation();


    const createPeer = (peerType: string, userId: Number) => {
        const peer = new RTCPeerConnection({
            iceServers: [{
                urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
            }]
        });
        if (peerType !== "broadcast") {
            if (peerType === "collaborator") {
                peer.ontrack = handleCollabTrackEvent;
            } else {
                peer.ontrack = handleTrackEvent;
            }
        }
        peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer, peerType, userId);
        return peer;
    }

    const handleTrackEvent =(e: any) => {
        console.log("viewer recieved broadcaster track")
        if (broadcasterVideo.current && collaboratorVideo.current) {
            setIsStreaming(true);
            console.log(e.track)
            let inboundStream = new MediaStream([e.track]);
            if (!broadcasterVideo.current.srcObject) {
                console.log("viewer recieved broadcaster track")
                broadcasterVideo.current.srcObject = inboundStream;
            } else {
                console.log("viewer recieved collab track")
                collaboratorVideo.current.srcObject = inboundStream;
            }
        }
    };

    const handleCollabTrackEvent =(e: any) => {
        console.log("collab recieved broadcaster track");
        if (broadcasterVideo.current) {
            broadcasterVideo.current.srcObject = e.streams[0];
        }
    };

    const handleNegotiationNeededEvent = async (peer: RTCPeerConnection, peerType: string, userId: Number) => {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        const payload: payload = { sdp: peer.localDescription, userId: id, broadcasterId: null };
        if (peerType !== "broadcast") {
            payload.broadcasterId = userId;
        }
        fetch(`http://localhost:4000/${peerType}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        }).then(async res => {

            const {sdp} = await res.json();
            const desc = new RTCSessionDescription(sdp);
            peer.setRemoteDescription(desc).catch(e => console.log(e));
            if (peerType === "broadcast" && (!data || !data.broadcasters.some(broadcaster => broadcaster.userid === id))) {
                await saveBroadcaster({
                    variables: {
                        userid: id,
                        email
                    },
                    update: (store, { data }) => {
                        console.log(data?.saveBroadcaster);
                        const existingBroadcasters = store.readQuery<BroadcastersQuery>({
                            query: BroadcastersDocument,
                        })
                        if (!data) {
                            return null;
                        }
                        store.writeQuery({
                            query: BroadcastersDocument,
                            data: {
                                broadcasters: existingBroadcasters ? [...existingBroadcasters?.broadcasters, data.saveBroadcaster] : [data.saveBroadcaster]
                            }
                        })
                    }
                });
            }
        })
    }

    return <div>
            {body}
            <button onClick={async () => {
                await logout();
                await setAccessToken("");
                history.push("/");
            }}>log out</button>
        </div>
}
  
export default Dashboard;