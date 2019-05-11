import { test, assertEquals, TestFunction } from "../deps.ts";
import { Client } from "../mod.ts";
import { TEST_CONNECTION_PARAMS, DEFAULT_SETUP } from "./constants.ts";

const CLIENT = new Client(TEST_CONNECTION_PARAMS);

async function testClient(t: TestFunction, setupQueries?: Array<string>) {
  const fn = async () => {
    try {
      await CLIENT.connect();
      for (const q of setupQueries || DEFAULT_SETUP) {
        await CLIENT.query(q);
      }
      await t();
    } finally {
      await CLIENT.end();
    }
  };
  const name = t.name;
  test({ fn, name });
}

testClient(async function simpleQuery() {
  const result = await CLIENT.query("SELECT * FROM ids;");
  assertEquals(result.rows.length, 2);
});

testClient(async function parametrizedQuery() {
  const result = await CLIENT.query("SELECT * FROM ids WHERE id < $1;", 2);
  assertEquals(result.rows.length, 1);

  const objectRows = result.rowsOfObjects();
  const row = objectRows[0];

  assertEquals(row.id, 1);
  assertEquals(typeof row.id, "number");
});

testClient(async function nativeType() {
  const result = await CLIENT.query("SELECT * FROM timestamps;");
  const row = result.rows[0];

  const expectedDate = Date.UTC(2019, 1, 10, 6, 0, 40, 5);

  assertEquals(row[0].toUTCString(), new Date(expectedDate).toUTCString());

  await CLIENT.query("INSERT INTO timestamps(dt) values($1);", new Date());
});
