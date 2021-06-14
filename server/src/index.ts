import "reflect-metadata";
import "dotenv/config"
import express from "express";
import {ApolloServer} from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./UserResolver";
import { createConnection } from "typeorm";
import cookieParser from "cookie-parser";
import { verify } from "jsonwebtoken";
import { User } from "./entity/User";
import { createAccessToken, createRefreshToken } from "./auth";
import { sendRefreshToken } from "./sendRefreshToken";

(async () => {
    // creates an express app
    const app = express();
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
    // creates tables for the defined entities by reading the ormconfig
    await createConnection();
    // creates graphql server
    const apolloServer = new ApolloServer({
       schema: await buildSchema({
           resolvers: [UserResolver]
       }),
       // passes in express req, res to graphql
       context: ({req, res}) => ({req, res})
    })
    // links graphql and express servers
    apolloServer.applyMiddleware({app});
    // listens to express server on port 4000
    app.listen(4000, () => {
        console.log("express server started");
    })
})()
