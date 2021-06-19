import "reflect-metadata";
import "dotenv/config"
import express, { RequestHandler} from "express";
import {ApolloServer} from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./UserResolver";
import { BroadcasterResolver } from "./BroadcasterResolver";
import { createConnection } from "typeorm";
import cookieParser from "cookie-parser";
import cors from "cors";
const webrtc = require("wrtc");
import { verify } from "jsonwebtoken";
import { User } from "./entity/User";
import { createAccessToken, createRefreshToken } from "./auth";
import { sendRefreshToken } from "./sendRefreshToken";

(async () => {
    let broadcasterStreams: {userId: number, stream: MediaStream, collaboratorIds: number[]}[] = [];
    let collaboratorStreams: {userId: number, stream: MediaStream}[] = [];

    // creates an express app
    const app = express();
    app.use(cors({
        origin: "http://localhost:3000",
        credentials: true,
    }));
    app.use(express.json() as RequestHandler);
    // middleware to parse cookies and store in req.cookies, will run before every express route evaluates
    app.use(cookieParser());
    // generates access token if expired
    app.post("/refresh_token", async (req, res) => {
        // gets refresh token from cookies parsed by cookie-parser
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.send({ ok: false, accessToken: "" });
        }
        let payload: any = null;
        try {
            // verifies the refresh token sent by client
            payload = verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!)
        } catch (error) {
            return res.send({ ok: false, accessToken: "" });
        }
        // finds the user who passed the token
        const user = await User.findOne({ id: payload.userId});
        if (!user) {
            return res.send({ ok: false, accessToken: "" });
        }
        // compares token version
        if (user.tokenVersion != payload.tokenVersion) {
            return res.send({ ok: false, accessToken: "" });
        }
        sendRefreshToken(res, createRefreshToken(user));
        // creates new access token if user found
        return res.send({ ok: true, accessToken: createAccessToken(user) });
    });
    app.post('/broadcast', async ({body} , res) => {
        const peer = new webrtc.RTCPeerConnection({
            iceServers: [
                {
                    urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"]
                }
            ]
        });
        peer.ontrack = (e: { streams: any[]; }) => handleTrackEvent(e, body.userId);
        const desc = new webrtc.RTCSessionDescription(body.sdp);
        await peer.setRemoteDescription(desc);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        const payload = {
            sdp: peer.localDescription
        }
    
        res.json(payload);
    });
    app.post("/consumer", async ({ body }, res) => {
        const peer = new webrtc.RTCPeerConnection({
            iceServers: [
                {
                    urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"]
                }
            ]
        });
        const desc = new webrtc.RTCSessionDescription(body.sdp);
        await peer.setRemoteDescription(desc);
        const broadcasterObject = broadcasterStreams.find(x => x.userId === body.broadcasterId);
        if (broadcasterObject) {
            console.log("viewer adding b track", body.userId);
            let combinedTracks: MediaStreamTrack[] = [];
            broadcasterObject.stream.getTracks().forEach(track => {
                console.log('adading b')
                combinedTracks.push(track);
                // peer.addTrack(track, broadcasterObject.stream)
            });
            console.log("collabs of b", broadcasterObject?.collaboratorIds);
            if (broadcasterObject?.collaboratorIds.length) {
                const collaboratorObject = collaboratorStreams.find(x => x.userId === broadcasterObject?.collaboratorIds[0]);
                console.log("collabs ob", collaboratorObject);
                if (collaboratorObject) {
                    console.log("if collabs ob", collaboratorObject);
                    collaboratorObject.stream.getTracks().forEach(track => {
                        console.log('adading')
                        combinedTracks.push(track);
                        //  peer.addTrack(track, collaboratorObject.stream)
                    });
                }
            }
            combinedTracks.forEach(track => peer.addTrack(track));
        }
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        const payload = {
            sdp: peer.localDescription
        }
    
        res.json(payload);
    });
    app.post('/collaborator', async ({body} , res) => {
        const peer = new webrtc.RTCPeerConnection({
            iceServers: [
                {
                    urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"]
                }
            ]
        });
        broadcasterStreams = broadcasterStreams.map(x => {
            if (x.userId === body.broadcasterId) {
                x.collaboratorIds = [...x.collaboratorIds, body.userId];
            }
            return x;
        });
        console.log("broadcasterStreams", broadcasterStreams);
        const broadcasterObject = broadcasterStreams.find(x => x.userId === body.broadcasterId);
        console.log("collabs broadcaster", broadcasterObject);
        if (broadcasterObject) {
            broadcasterObject.stream.getTracks().forEach(track => peer.addTrack(track, broadcasterObject.stream));
        }
        peer.ontrack = (e: { streams: any[]; }) => {
            console.log("push collabs track", body.userId);
            collaboratorStreams.push({userId: body.userId, stream: e.streams[0]});
        };
        const desc = new webrtc.RTCSessionDescription(body.sdp);
        await peer.setRemoteDescription(desc);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        const payload = {
            sdp: peer.localDescription
        }
    
        res.json(payload);
    });
    const handleTrackEvent = (e: { streams: any[]; }, userId: number) => {
        broadcasterStreams.push({userId, stream: e.streams[0], collaboratorIds: [] });
    }
    // creates tables for the defined entities by reading the ormconfig
    await createConnection();
    // creates graphql server
    const apolloServer = new ApolloServer({
       schema: await buildSchema({
           resolvers: [UserResolver, BroadcasterResolver]
       }),
       // passes in express req, res to graphql
       context: ({req, res}) => ({req, res})
    })
    // links graphql and express servers and disable apollo cors
    apolloServer.applyMiddleware({app, cors: false});
    // listens to express server on port 4000
    app.listen(4000, () => {
        console.log("express server started");
    })
})()
