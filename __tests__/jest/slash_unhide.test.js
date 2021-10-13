const { execute } = require("../../src/discordBot/commands/faculty/unhide");
const { sendEphemeral, editErrorEphemeral, editEphemeral } = require("../../src/discordBot/services/message");
const {
  updateGuide,
  msToMinutesAndSeconds,
  setCourseToPublic,
  checkCourseCooldown,
  getHiddenCourse } = require("../../src/discordBot/services/service");

jest.mock("../../src/discordBot/services/message");
jest.mock("../../src/discordBot/services/service");


const time = "4:59";
const initialResponse = "Unhiding course...";
const { defaultTeacherInteraction } = require("../mocks/mockInteraction");
const courseName = "test";
defaultTeacherInteraction.options = { getString: jest.fn(() => courseName) };

afterEach(() => {
  jest.clearAllMocks();
});

describe("slash unhide command", () => {
  test("unhide command with invalid course name responds with correct ephemeral", async () => {
    const client = defaultTeacherInteraction.client;
    const response = `Invalid course name: ${courseName} or the course is public already!`;
    await execute(defaultTeacherInteraction, client);
    expect(getHiddenCourse).toHaveBeenCalledTimes(1);
    expect(sendEphemeral).toHaveBeenCalledTimes(1);
    expect(sendEphemeral).toHaveBeenCalledWith(defaultTeacherInteraction, initialResponse);
    expect(editErrorEphemeral).toHaveBeenCalledTimes(1);
    expect(editErrorEphemeral).toHaveBeenCalledWith(defaultTeacherInteraction, response);
    expect(updateGuide).toHaveBeenCalledTimes(0);
  });

  test("unhide command with valid course name responds with correct ephemeral", async () => {
    getHiddenCourse.mockImplementationOnce((name) => { return { name: `👻 ${name}`, setName: jest.fn() }; });
    const client = defaultTeacherInteraction.client;
    const response = `This course ${courseName} is now public.`;
    await execute(defaultTeacherInteraction, client);
    expect(getHiddenCourse).toHaveBeenCalledTimes(1);
    expect(setCourseToPublic).toHaveBeenCalledTimes(1);
    expect(sendEphemeral).toHaveBeenCalledTimes(1);
    expect(sendEphemeral).toHaveBeenCalledWith(defaultTeacherInteraction, initialResponse);
    expect(editEphemeral).toHaveBeenCalledTimes(1);
    expect(editEphemeral).toHaveBeenCalledWith(defaultTeacherInteraction, response);
    expect(client.emit).toHaveBeenCalledTimes(1);
    expect(updateGuide).toHaveBeenCalledTimes(1);
  });

  test("unhide command with cooldown", async () => {
    getHiddenCourse.mockImplementation((name) => { return { name: `👻 ${name}`, setName: jest.fn() }; });
    checkCourseCooldown.mockImplementation(() => time);
    const client = defaultTeacherInteraction.client;
    await execute(defaultTeacherInteraction, client);
    expect(getHiddenCourse).toHaveBeenCalledTimes(1);
    expect(msToMinutesAndSeconds).toHaveBeenCalledTimes(1);
    expect(sendEphemeral).toHaveBeenCalledTimes(1);
    expect(sendEphemeral).toHaveBeenCalledWith(defaultTeacherInteraction, initialResponse);
    expect(editErrorEphemeral).toHaveBeenCalledTimes(1);
    expect(client.emit).toHaveBeenCalledTimes(0);
    expect(updateGuide).toHaveBeenCalledTimes(0);
  });
});