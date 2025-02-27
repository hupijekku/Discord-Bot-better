const { execute } = require("../../../src/discordBot/commands/admin/delete_course");
const { findCategoryWithCourseName } = require("../../../src/discordBot/services/service");
const { updateGuide, removeCourseFromDb } = require("../../../src/db/services/courseService");
const { confirmChoiceNoInteraction } = require("../../../src/discordBot/services/message");

jest.mock("../../../src/discordBot/services/message");
jest.mock("../../../src/discordBot/services/service");
const createCategoryInstanceMock = (name) => {
  return { name: `📚 ${name}`, delete: jest.fn() };
};
jest.mock("../../../src/db/services/courseService");

findCategoryWithCourseName
  .mockImplementation((name) => createCategoryInstanceMock(name))
  .mockImplementationOnce(() => null);

const { messageInCommandsChannel, teacher, student } = require("../../mocks/mockMessages");

confirmChoiceNoInteraction.mockImplementation(() => true);

afterEach(() => {
  jest.clearAllMocks();
});

const Course = {
  create: jest.fn(),
  findOne: jest
    .fn(() => true)
    .mockImplementationOnce(() => false),
  destroy: jest.fn(),
};

describe("prefix remove", () => {
  test("Only administrator can use remove command", async () => {
    messageInCommandsChannel.member = student;
    const courseName = "test";
    await execute(messageInCommandsChannel, [courseName], Course);
    expect(findCategoryWithCourseName).toHaveBeenCalledTimes(0);
    expect(messageInCommandsChannel.reply).toHaveBeenCalledTimes(0);
    expect(removeCourseFromDb).toHaveBeenCalledTimes(0);
    expect(updateGuide).toHaveBeenCalledTimes(0);
  });

  test("remove command with invalid course name responds correct ephemeral", async () => {
    messageInCommandsChannel.member = teacher;
    const courseName = "invalidName";
    const response = `Error: Invalid course name: ${courseName}.`;
    await execute(messageInCommandsChannel, [courseName], Course);
    expect(confirmChoiceNoInteraction).toHaveBeenCalledTimes(1);
    expect(findCategoryWithCourseName).toHaveBeenCalledTimes(1);
    expect(messageInCommandsChannel.reply).toHaveBeenCalledTimes(1);
    expect(messageInCommandsChannel.reply).toHaveBeenCalledWith(response);
  });

  test("remove command with valid course name responds correct ephemeral", async () => {
    messageInCommandsChannel.member = teacher;
    const courseName = "test";
    await execute(messageInCommandsChannel, [courseName], Course);
    expect(confirmChoiceNoInteraction).toHaveBeenCalledTimes(1);
    expect(findCategoryWithCourseName).toHaveBeenCalledTimes(1);
    expect(removeCourseFromDb).toHaveBeenCalledTimes(1);
    expect(updateGuide).toHaveBeenCalledTimes(1);
  });
});
