require("dotenv").config();
const supertest = require("supertest");
const SequelizeMock = require("sequelize-mock");
const dbMock = new SequelizeMock();

const makeApp = require("../../src/server/app");

const client = {
  guilds: {
    fetch: jest.fn(() => {
      const guild = {
        roles: {
          cache: [{ name: "test", members: [] }],
        },
      };
      return guild;
    },
    ),
  },
};

const app = makeApp(client, dbMock);
const api = supertest(app);

describe("Endpoint urls", () => {
  test("default url return status 200", async () => {
    await api
      .get("/")
      .expect(200);
  });
  test("invalid url returns status 302", async () => {
    await api
      .get("/invalidURL")
      .expect(302);
  });
  test("invalid invite returns status 400", async () => {
    await api
      .get("/join/invalidURL")
      .expect(400);
  });
});
