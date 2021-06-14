import { verify } from "jsonwebtoken";
import { MiddlewareFn } from "type-graphql";
import { MyContext } from "./MyContext";

export const isAuth: MiddlewareFn<MyContext> = ({context}, next) => {
    // fetch access token sent by client (Eg :- bearer accessToken)
    const authorization = context.req.headers['authorization'];
    
    if (!authorization) {
        throw new Error("not authenticated");
    }
    try {
        const accessToken = authorization.split(" ")[1];
        // payload is the object we passed in while creating token
        const payload = verify(accessToken, process.env.ACCESS_TOKEN_SECRET!);
        context.payload = payload as any;
    } catch (error) {
        throw new Error("not authenticated");
    }
    return next();
}