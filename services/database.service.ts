// external dependencies
import * as mongoDB from "mongodb";
import * as config from '../config.json';
import Quote from "../models/quote";

// global variables
export const collections: { 
    quotes?: mongoDB.Collection<Quote>,
    codes?: mongoDB.Collection,
} = {};

// initialize connection
export async function connectToDatabase() {
    const client: mongoDB.MongoClient = new mongoDB.MongoClient(config.mongo_db_conn_string);
    await client.connect();
    const db: mongoDB.Db = client.db(config.mongo_db_name);
    const quotes: mongoDB.Collection<Quote> = db.collection(config.mongo_db_collection_name);

    const tdb: mongoDB.Db = client.db('discord');
    const codes: mongoDB.Collection = tdb.collection('codes');

    collections.quotes = quotes;
    collections.codes = codes;
    console.log(`successfully connected to:\ndatabase: ${db.databaseName}\ncollection: ${quotes.collectionName}`);
};
