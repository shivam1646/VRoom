import "reflect-metadata";
import "dotenv/config"
import express from "express";
import {ApolloServer} from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./UserResolver";
import { createConnection } from "typeorm";

(async () => {
    // create an express app
    const app = express();
    // creates tables for the defined entities by reading the ormconfig
    await createConnection();
    // create graphql server
    const apolloServer = new ApolloServer({
       schema: await buildSchema({
           resolvers: [UserResolver]
       }),
       // pass in express req, res to graphql
       context: ({req, res}) => ({req, res})
    })
    // link graphql and express servers
    apolloServer.applyMiddleware({app});
    // listen to express server on port 4000
    app.listen(4000, () => {
        console.log("express server started");
    })
})()
