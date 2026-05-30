import { MongoClient } from "mongodb";
import dns from "node:dns";

const globalForMongo = globalThis;
const DEFAULT_DNS_SERVERS = ["1.1.1.1", "8.8.8.8"];

function getMongoUri() {
  return process.env.MONGODB_URI || process.env.MONGO_DB_CONNECTION_STRING || "";
}

function getMongoDbName() {
  return process.env.MONGODB_DB_NAME || "bobot";
}

export function getMongoConfig() {
  const uri = getMongoUri();
  const dbName = getMongoDbName();
  const uriHost = uri ? new URL(uri).host : "";
  return { uri, dbName, uriHost };
}

export function getMongoClient() {
  const { uri } = getMongoConfig();

  if (!uri) {
    throw new Error("missing MONGODB_URI");
  }

  if (uri.startsWith("mongodb+srv://")) {
    const configuredServers =
      process.env.MONGODB_DNS_SERVERS?.split(",").map((value) => value.trim()).filter(Boolean) ||
      DEFAULT_DNS_SERVERS;
    dns.setServers(configuredServers);
  }

  if (!globalForMongo.mongoClientPromise) {
    const client = new MongoClient(uri);
    globalForMongo.mongoClientPromise = client.connect();
  }

  return globalForMongo.mongoClientPromise.catch((error) => {
    globalForMongo.mongoClientPromise = undefined;
    throw error;
  });
}

export async function checkMongoConnection() {
  const { dbName, uriHost } = getMongoConfig();
  const client = await getMongoClient();
  await client.db(dbName).command({ ping: 1 });
  return { dbName, uriHost };
}
