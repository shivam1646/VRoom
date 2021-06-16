import { compare, hash } from "bcryptjs"
import {Resolver, Query, Mutation, Arg, ObjectType, Field, Ctx, UseMiddleware, Int} from "type-graphql"
import { getConnection } from "typeorm";
import { createAccessToken, createRefreshToken } from "./auth";
import { User } from "./entity/User"
import { isAuth } from "./isAuth";
import { MyContext } from "./MyContext";
import { sendRefreshToken } from "./sendRefreshToken";


// graphql schema :- defines list of queries a user can perform
// Eg without typegraphql :-
// typeDefs: `
//     type Query {
//         hello: String!
//     }
// `,
// resolvers :- defines how the above queries get resolved
// Eg without typegraphql :-
// resolvers: {
//     Query: {
//         hello: () => "Hello World"
//     }
// }

// create a graphql type for login response
@ObjectType()
class LoginResponse {
    @Field()
    accessToken: string
}


@Resolver()
export class UserResolver {
    @Query(() => String)
    hello() {
        return "Hi";
    }

    @Query(() => String)
    @UseMiddleware(isAuth)
    home(
        @Ctx() {payload}: MyContext
    ) {
        return `Welcome user ${payload?.userId}`;
    }

    @Query(() => User, {nullable: true})
    @UseMiddleware(isAuth)
    loggedInUser(
        @Ctx() {payload}: MyContext
    ) {
        if (!payload) {
            return null;
        }
        try {
            return User.findOne(payload.userId);
        } catch (error) {
            return null;
        }
    }
 
    @Query(() => [User])
    users() {
        return User.find();
    }

    // revokes refresh token in case of forgot password, account hacked
    @Mutation(() => Boolean)
    async revokeRefreshTokensForUser(
        @Arg("userId", () => Int) userId: number
    ) {
        await getConnection().getRepository(User).increment({id: userId}, "tokenVersion", 1);
        return true;
    }

    // revokes refresh token in case of forgot password, account hacked
    @Mutation(() => Boolean)
    async logout(
        @Ctx() {res}: MyContext
    ) {
        sendRefreshToken(res, "");
        return true;
    }

    // create a mutation to login user
    // returns a LoginResponse graphql type
    @Mutation(() => LoginResponse)
    async login(
        @Arg("email") email: string,
        @Arg("password") password: string,
        @Ctx() {res}: MyContext
    ) : Promise<LoginResponse> {
        // check if user exists
        const user = await User.findOne({where: {email}});
        if (!user) {
            throw new Error("could not find user");
        }
        // check if password is valid
        const isPasswordValid = await compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error("incorrect password");
        }
        // store refresh token
        sendRefreshToken(res, createRefreshToken(user));
        return {
            // generate access token using JWT
            accessToken: createAccessToken(user),
        };
    }

    @Mutation(() => Boolean)
    async register(
        @Arg("email") email: string,
        @Arg("password") password: string,
    ) {
        // encrypt password
        const hashedPassword = await hash(password, 12);
        try {
            // insert in db
            await User.insert({
                email,
                password: hashedPassword
            });
        } catch (error) {
            console.log(error);
            return false;
        }
        return true;
    }
}