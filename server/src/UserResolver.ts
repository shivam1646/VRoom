import { compare, hash } from "bcryptjs"
import {Resolver, Query, Mutation, Arg, ObjectType, Field, Ctx, UseMiddleware} from "type-graphql"
import { createAccessToken, createRefreshToken } from "./auth";
import { User } from "./entity/User"
import { isAuth } from "./isAuth";
import { MyContext } from "./MyContext";


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
    @UseMiddleware(isAuth)
    home(
        @Ctx() {payload}: MyContext
    ) {
        return `Welcome user ${payload?.userId}`;
    }
    
    @Query(() => [User])
    users() {
        return User.find();
    }

    // create a mutation to login user
    // returns a LoginResponse graphql type
    @Mutation(() => LoginResponse)
    async login(
        @Arg('email') email: string,
        @Arg('password') password: string,
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
        res.cookie(
            "refreshToken",
            createRefreshToken(user),
            {httpOnly: true}
        );
       
        return {
            // generate access token using JWT
            accessToken: createAccessToken(user),
        };
    }

    @Mutation(() => Boolean)
    async register(
        @Arg('email') email: string,
        @Arg('password') password: string,
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