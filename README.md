# VRoom

Video rooms

Steps to setup server:

1. Install TypeORM :- `npm i -g typeorm`
2. Setup db and services :- `typeorm init --name server --database postgres`
3. Install PostgreSQL and `createdb vroom`
4. Install server dependencies `npm i`
5. Start server `npm start`

Steps to setup client:

1. Generates hooks, HOCs, components from our graphql schema and operations :- `npx graphql-codegen init`. Config file is codegen.yml
2. Install client dependencies `npm i`
3. Start client `npm start`