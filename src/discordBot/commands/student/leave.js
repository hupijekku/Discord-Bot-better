const { SlashCommandBuilder } = require("@discordjs/builders");
const { updateGuide } = require("../../services/service");
const { editEphemeral, editErrorEphemeral, sendEphemeral } = require("../../services/message");
const { courseAdminRole } = require("../../../../config.json");

const execute = async (interaction, client, Course) => {
  await sendEphemeral(interaction, "Leaving course...");
  const roleString = interaction.options.getString("course").trim();

  const guild = client.guild;

  const member = guild.members.cache.get(interaction.member.user.id);
  const courseRoles = client.guild.roles.cache
    .filter(role => (role.name === `${roleString} ${courseAdminRole}` || role.name === `${roleString}`))
    .map(role => role.name);


  if (!courseRoles.length) return await editErrorEphemeral(interaction, `Invalid course name: ${roleString}`);
  if (!member.roles.cache.some((r) => courseRoles.includes(r.name))) return await editErrorEphemeral(interaction, `You are not on a ${roleString} course.`);

  await member.roles.cache
    .filter(role => courseRoles.includes(role.name))
    .map(async role => await member.roles.remove(role));
  await member.fetch(true);

  await editEphemeral(interaction, `You have been removed from the ${roleString} course.`);
  await updateGuide(client.guild, Course);
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Leave the course.")
    .setDefaultPermission(true)
    .addStringOption(option =>
      option.setName("course")
        .setDescription("Course to leave.")
        .setRequired(true)),
  execute,
  usage: "/leave [course name]",
  description: "Leave the course.",
};
