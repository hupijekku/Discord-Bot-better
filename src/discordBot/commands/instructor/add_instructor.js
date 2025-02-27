const { SlashCommandBuilder } = require("@discordjs/builders");
const { getCourseNameFromCategory, isCourseCategory, updateInviteLinks } = require("../../services/service");
const { findUserByDiscordId } = require("../../../db/services/userService");
const { findCourseFromDb } = require("../../../db/services/courseService");
const { findCourseMember } = require("../../../db/services/courseMemberService");
const { editEphemeral, editErrorEphemeral, sendEphemeral } = require("../../services/message");
const { courseAdminRole, facultyRole } = require("../../../../config.json");

const execute = async (interaction, client, models) => {
  await sendEphemeral(interaction, "Adding instructor...");
  const guild = client.guild;
  const channel = guild.channels.cache.get(interaction.channelId);
  const roleName = channel.parent ? getCourseNameFromCategory(channel.parent) : "";
  let hasPermission = false;
  interaction.member._roles.forEach(roleId => {
    const role = guild.roles.cache.get(roleId);
    if (role.name === "admin" || role.name === facultyRole || role.name === `${roleName} ${courseAdminRole}`) {
      hasPermission = true;
    }
  });

  if (!hasPermission) {
    return editErrorEphemeral(interaction, "You don't have the permission to use this command!");
  }
  if (!isCourseCategory(channel?.parent)) {
    return editErrorEphemeral(interaction, "Command must be used in a course channel!");
  }

  const instructorRole = guild.roles.cache.find(r => r.name === `${roleName} ${courseAdminRole}`);
  const memberToPromote = guild.members.cache.get(interaction.options.getUser("user").id);

  const userInstance = await findUserByDiscordId(memberToPromote.id, models.User);
  const courseInstance = await findCourseFromDb(roleName, models.Course);
  const courseMemberInstance = await findCourseMember(userInstance.id, courseInstance.id, models.CourseMember);

  if (!courseMemberInstance) {
    return editErrorEphemeral(interaction, "Selected user must be a member of this course!");
  }

  courseMemberInstance.instructor = true;
  await courseMemberInstance.save();

  memberToPromote.roles.add(instructorRole);

  await updateInviteLinks(guild, courseAdminRole, facultyRole, client);

  return await editEphemeral(interaction, `Gave role '${instructorRole.name}' to ${memberToPromote.displayName}.`);
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("add_instructor")
    .setDescription("Add instructor to the course.")
    .setDefaultPermission(false)
    .addUserOption(option =>
      option.setName("user")
        .setDescription("@User to be added as instructor")
        .setRequired(true)),
  execute,
  usage: "/add_instructor [member]",
  description: "Add instructor to the course.*",
  roles: ["admin", facultyRole, courseAdminRole],
};