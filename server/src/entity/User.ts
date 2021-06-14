import { Field, Int, ObjectType } from "type-graphql";
import {Entity, PrimaryGeneratedColumn, Column, BaseEntity} from "typeorm";

@ObjectType()      // to use this as a graphql type
@Entity("users")
export class User extends BaseEntity {

    @Field(() => Int)       // to use this as a graphql field
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column()
    email: string;

    @Column()
    password: string;

}
