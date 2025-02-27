const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  findOrCreateRoleWithName,
  createInvitation,
  findOrCreateChannel,
  setCoursePositionABC,
  containsEmojis } = require("../../services/service");
const {
  createCourseToDatabase,
  findCourseFromDb,
  findCourseFromDbWithFullName,
  updateGuide } = require("../../../db/services/courseService");
const { createChannelToDatabase } = require("../../../db/services/channelService");
const { sendErrorEphemeral, sendEphemeral, editEphemeral } = require("../../services/message");
const { courseAdminRole, facultyRole } = require("../../../../config.json");

const getPermissionOverwrites = (guild, admin, student) => ([
  {
    id: guild.id,
    deny: ["VIEW_CHANNEL"],
  },
  {
    id: guild.me.roles.highest,
    allow: ["VIEW_CHANNEL"],
  },
  {
    id: admin.id,
    allow: ["VIEW_CHANNEL"],
  },
  {
    id: student.id,
    allow: ["VIEW_CHANNEL"],
  },
]);

const getChannelObjects = (guild, admin, student, roleName, category) => {
  roleName = roleName.replace(/ /g, "-");
  return [
    {
      name: `${roleName}_announcement`,
      options: {
        type: "GUILD_TEXT",
        description: "Messages from course admins",
        parent: category,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: ["VIEW_CHANNEL"],
          },
          {
            id: student,
            deny: ["SEND_MESSAGES"],
            allow: ["VIEW_CHANNEL"],
          },
          {
            id: admin,
            allow: ["VIEW_CHANNEL", "SEND_MESSAGES"],
          },
        ],
      },
    },
    {
      name: `${roleName}_general`,
      parent: category,
      options: { type: "GUILD_TEXT", parent: category, permissionOverwrites: [] },
    },
    {
      name: `${roleName}_voice`,
      parent: category,
      options: { type: "GUILD_VOICE", parent: category, permissionOverwrites: [] },
    },
  ];
};

const getCategoryObject = (categoryName, permissionOverwrites) => ({
  name: `📚 ${categoryName}`,
  options: {
    type: "GUILD_CATEGORY",
    permissionOverwrites,
  },
});

const execute = async (interaction, client, models) => {
  const courseCode = interaction.options.getString("coursecode").replace(/\s/g, "");
  const courseFullName = interaction.options.getString("full_name").trim();
  if (await findCourseFromDbWithFullName(courseFullName, models.Course)) return await sendErrorEphemeral(interaction, "Course fullname must be unique.");

  let courseName;
  let errorMessage;
  if (!interaction.options.getString("nick_name")) {
    courseName = courseCode.toLowerCase();
    errorMessage = "Course code must be unique.";
  }
  else {
    courseName = interaction.options.getString("nick_name").replace(/\s/g, "").toLowerCase();
    errorMessage = "Course nick name must be unique.";
  }

  if (containsEmojis(courseCode) || containsEmojis(courseFullName) || containsEmojis(courseName)) {
    return await sendErrorEphemeral(interaction, "Emojis are not allowed!");
  }

  const courseNameConcat = courseCode + " - " + courseFullName + " - " + courseName;
  if (courseNameConcat.length >= 99) {
    return await sendErrorEphemeral(interaction, "Course code, name and nickname are too long!");
  }

  if (await findCourseFromDb(courseName, models.Course)) return await sendErrorEphemeral(interaction, errorMessage);
  await sendEphemeral(interaction, "Creating course...");
  const guild = client.guild;

  const student = await findOrCreateRoleWithName(courseName, guild);
  const admin = await findOrCreateRoleWithName(`${courseName} ${courseAdminRole}`, guild);

  const categoryObject = getCategoryObject(courseName, getPermissionOverwrites(guild, admin, student));
  const category = await findOrCreateChannel(categoryObject, guild);

  const channelObjects = getChannelObjects(guild, admin, student, courseName, category);
  await Promise.all(channelObjects.map(
    async channelObject => await findOrCreateChannel(channelObject, guild),
  ));

  const course = await createCourseToDatabase(courseCode, courseFullName, courseName, models.Course);
  await Promise.all(channelObjects
    .map(async channelObject => {
      const voiceChannel = channelObject.options.type === "GUILD_VOICE";
      await createChannelToDatabase({
        courseId: course.id,
        name: channelObject.name,
        defaultChannel: true,
        voiceChannel: voiceChannel }, models.Channel);
    }));

  await setCoursePositionABC(guild, categoryObject.name);
  await createInvitation(guild, courseName);
  await editEphemeral(interaction, `Created course ${courseName}.`);
  await client.emit("COURSES_CHANGED", models.Course);
  await updateGuide(client.guild, models.Course);
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("create_course")
    .setDescription("Create a new course.")
    .setDefaultPermission(false)
    .addStringOption(option =>
      option.setName("coursecode")
        .setDescription("Course coursecode")
        .setRequired(true))
    .addStringOption(option =>
      option.setName("full_name")
        .setDescription("Course full name")
        .setRequired(true))
    .addStringOption(option =>
      option.setName("nick_name")
        .setDescription("Course nick name")
        .setRequired(false)),
  execute,
  usage: "/create_course [course name]",
  description: "Create a new course.",
  roles: ["admin", facultyRole],
};
