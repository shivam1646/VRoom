import { Arg, Mutation, Query, Resolver } from "type-graphql";
import { Broadcaster } from "./entity/Broadcaster";

@Resolver()
export class BroadcasterResolver {
    @Query(() => [Broadcaster])
    broadcasters() {
        return Broadcaster.find();
    }

    @Mutation(() => Broadcaster)
    async saveBroadcaster(
        @Arg("userid") userid: number,
        @Arg("email") email: string,
    ) {
        // insert in db
        await Broadcaster.insert({
            userid,
            email
        });
        return Broadcaster.findOne({where: {userid}});
    }
}