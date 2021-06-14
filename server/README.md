# VRoom

Steps to run this project:

1. Install TypeORM :- `npm i -g typeorm`
2. Setup db and services :- `typeorm init --name server --database postgres`
3. Install PostgreSQL and `createdb vroom`
4. Create a user by running `npm start` in server folder
5. `npm add express apollo-server-express graphql type-graphql bcrypt` in server folder
6. `npm install @types/graphql @types/express @types/bcryptjs --save-dev` for typescript support
7. `npm add jsonwebtoken`
8. `npm add @types/jsonwebtoken --save-dev`
9. To parse cookies : `npm add cookie-parser` `npm add @types/cookie-parser --save-dev`
