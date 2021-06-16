import { Field, Int, ObjectType } from "type-graphql";
import {Entity, PrimaryGeneratedColumn, Column, BaseEntity} from "typeorm";

@ObjectType()      // to use this as a graphql type
@Entity("users")
export class User extends BaseEntity {

    @Field(() => Int)       // to use this as a graphql field
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column()        // text is by default
    email: string;

    @Column()
    password: string;

    // keeps track of how many times the access has been revoked for a user
    @Column("int", {default: 0})
    tokenVersion: number;

}
